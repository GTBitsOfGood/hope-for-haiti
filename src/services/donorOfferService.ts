import { db } from "@/db";
import {
  DonorOfferState,
  UserType,
  RequestPriority,
  ItemCategory,
  ItemType,
  DonorOffer,
  Prisma,
  GeneralItem,
  GeneralItemRequest,
  $Enums,
} from "@prisma/client";
import { format, isAfter } from "date-fns";
import { z } from "zod";
import { ArgumentError, NotFoundError } from "@/util/errors";
import {
  PartnerDonorOffer,
  AdminDonorOffer,
  PartnerDonorOffersResponse,
  AdminDonorOffersResponse,
  CreateDonorOfferResult,
  DonorOfferItemsRequestsDTO,
  DonorOfferItemsRequestsResponse,
  UpdateRequestItem,
  FinalizeDetailsResult,
  FinalizeDonorOfferResult,
  DonorOfferUpdateParams,
  GeneralItemRequestsResponse,
  GeneralItemLineItemsResponse,
} from "@/types/api/donorOffer.types";
import { Filters } from "@/types/api/filter.types";
import { buildQueryWithPagination, buildWhereFromFilters } from "@/util/table";
import { Partner } from "@/components/DonorOffers";
import { NotificationService } from "./notificationService";
import { MatchingService } from "./matchingService";

const DonorOfferItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  initialQuantity: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : Number(val)))
    .pipe(z.number().int().min(0, "Initial quantity must be non-negative")),
  expirationDate: z
    .union([
      z.coerce.date(),
      z.string().transform((val) => (val.trim() === "" ? undefined : val)),
    ])
    .optional(),
  unitType: z.string().trim(),
  description: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  weight: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : Number(val)))
    .pipe(z.number().min(0, "Weight must be non-negative")),
  type: z.nativeEnum(ItemType).optional(),
  category: z.nativeEnum(ItemCategory).optional(),
});

const DonorOfferSchema = z.object({
  offerName: z.string().trim().min(1, "Offer name is required"),
  donorName: z.string().trim().min(1, "Donor name is required"),
  partnerResponseDeadline: z.coerce.date(),
  donorResponseDeadline: z.coerce.date(),
  state: z.nativeEnum(DonorOfferState).default(DonorOfferState.UNFINALIZED),
});

const coerceNormalizedString = (value: unknown): string => {
  return String(value ?? "").replace(/\s+/g, " ").trim();
};

const coerceOptionalString = (options?: { allowEmpty?: boolean }) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val == null) {
        return options?.allowEmpty ? "" : undefined;
      }
      const normalized = coerceNormalizedString(val);
      if (!normalized && !options?.allowEmpty) {
        return undefined;
      }
      return normalized;
    });

const coerceRequiredString = () =>
  z
    .union([z.string(), z.number()])
    .transform((val) => coerceNormalizedString(val))
    .pipe(z.string().min(1));

const coerceNumber = () =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val == null || (typeof val === "string" && val.trim() === "")) {
        return undefined;
      }
      if (typeof val === "number") {
        return val;
      }
      const cleaned = val.replace(/[$,]/g, "");
      const parsed = Number(cleaned);
      return Number.isNaN(parsed) ? undefined : parsed;
    });

const coerceBoolean = (defaultValue: boolean) =>
  z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (typeof val === "boolean") {
        return val;
      }
      const normalized = (val ?? String(defaultValue))
        .toString()
        .trim()
        .toLowerCase();
      if (normalized === "true" || normalized === "false") {
        return normalized === "true";
      }
      throw new Error("Invalid boolean value");
    });

const FinalizeDonorOfferItemSchema = z.object({
  title: z.string().transform((v) => v.replace(/\s+/g, " ").trim()),
  donorName: coerceRequiredString(),
  unitType: z.string().transform((v) => v.replace(/\s+/g, " ").trim()),
  expirationDate: z
    .union([
      z.coerce.date(),
      z.string().transform((val) => (val.trim() === "" ? undefined : val)),
    ])
    .transform((d) => {
      if (d instanceof Date) {
        d.setUTCHours(0);
      }
      return d;
    }),
  weight: coerceNumber()
    .transform((val) => val ?? 0)
    .pipe(z.number().min(0, "Weight must be non-negative")),
  category: z.nativeEnum(ItemCategory).optional(),
  quantity: coerceNumber().pipe(
    z.number().int().min(0, "Quantity must be non-negative")
  ),
  lotNumber: coerceOptionalString({ allowEmpty: true }).transform(
    (val) => val ?? ""
  ),
  palletNumber: coerceOptionalString({ allowEmpty: true }).transform(
    (val) => val ?? ""
  ),
  boxNumber: coerceOptionalString({ allowEmpty: true }).transform(
    (val) => val ?? ""
  ),
  donorShippingNumber: coerceOptionalString({ allowEmpty: true }),
  hfhShippingNumber: coerceOptionalString({ allowEmpty: true }),
  unitPrice: coerceNumber().pipe(z.number().min(0)),
  maxRequestLimit: coerceOptionalString({ allowEmpty: true }),
  ndc: coerceOptionalString({ allowEmpty: true }),
  visible: coerceBoolean(false),
  allowAllocations: coerceBoolean(true),
  gik: coerceBoolean(true),
});

type FinalizeDonorOfferItem = z.infer<typeof FinalizeDonorOfferItemSchema>;

export default class DonorOfferService {
  private static normalizeExpirationDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      const normalized = new Date(value);
      normalized.setUTCHours(0, 0, 0, 0);
      return isNaN(normalized.getTime()) ? null : normalized;
    }

    if (typeof value === "string") {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        parsed.setUTCHours(0, 0, 0, 0);
        return parsed;
      }
    }

    return null;
  }

  private static datesWithinTolerance(
    a: Date | null,
    b: Date | null,
    toleranceDays: number
  ): boolean {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    const aMidnight = new Date(a);
    aMidnight.setUTCHours(0, 0, 0, 0);
    const bMidnight = new Date(b);
    bMidnight.setUTCHours(0, 0, 0, 0);
    const diffMs = Math.abs(aMidnight.getTime() - bMidnight.getTime());
    const oneDayMs = 24 * 60 * 60 * 1000;
    return diffMs <= toleranceDays * oneDayMs;
  }

  private static normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, " ").trim();
  }

  private static normalizeForComparison(value: string): string {
    return value.replace(/\s+/g, " ").trim().toLowerCase();
  }

  private static toGeneralItemCreateInputs(
    items: (typeof DonorOfferItemSchema._type)[],
    donorOfferId: number
  ): Prisma.GeneralItemCreateManyInput[] {
    return items.map((item) => {
      const result: Prisma.GeneralItemCreateManyInput = {
        donorOfferId,
        title: item.title,
        expirationDate:
          DonorOfferService.normalizeExpirationDate(item.expirationDate) ??
          null,
        unitType: item.unitType,
        initialQuantity: item.initialQuantity,
        description:
          item.description && item.description.length > 0
            ? item.description
            : null,
        weight: item.weight,
      };

      if (item.type) result.type = item.type;
      if (item.category) result.category = item.category;

      return result;
    });
  }

  private static aggregateGeneralItems(
    items: Prisma.GeneralItemCreateManyInput[]
  ): Prisma.GeneralItemCreateManyInput[] {
    const map = new Map<string, Prisma.GeneralItemCreateManyInput>();

    for (const item of items) {
      const keyParts = [
        item.donorOfferId,
        item.title,
        item.expirationDate instanceof Date
          ? item.expirationDate.toISOString().split("T")[0]
          : (item.expirationDate ?? "null"),
        item.unitType,
      ];
      const key = keyParts.join("|");

      const existing = map.get(key);
      if (existing) {
        existing.initialQuantity += item.initialQuantity;

        if (!existing.description && item.description) {
          existing.description = item.description;
        }
        continue;
      }

      map.set(key, { ...item });
    }

    return Array.from(map.values());
  }

  private static aggregatePreviewItems(
    items: (typeof DonorOfferItemSchema._type)[]
  ): (typeof DonorOfferItemSchema._type)[] {
    const aggregated = DonorOfferService.aggregateGeneralItems(
      DonorOfferService.toGeneralItemCreateInputs(items, 0)
    );

    return aggregated.map((item) => ({
      title: item.title,
      expirationDate: item.expirationDate ?? undefined,
      unitType: item.unitType,
      initialQuantity: item.initialQuantity,
      description: item.description ?? undefined,
      weight:
        typeof item.weight === "number" ? item.weight : Number(item.weight),
    }));
  }

  static async getPartnerDonorOffers(
    partnerId: number,
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<PartnerDonorOffersResponse> {
    const partner = await db.user.findUnique({
      where: { id: partnerId },
      select: { enabled: true, pending: true },
    });

    if (!partner?.enabled || partner?.pending) {
      return { donorOffers: [], total: 0 };
    }

    const filterWhere = buildWhereFromFilters<Prisma.DonorOfferWhereInput>(
      Object.keys(Prisma.DonorOfferScalarFieldEnum),
      filters
    );

    const where: Prisma.DonorOfferWhereInput = {
      ...filterWhere,
      partnerVisibilities: {
        some: {
          id: partnerId,
          enabled: true,
          pending: false,
        },
      },
    };

    const query = Prisma.validator<Prisma.DonorOfferFindManyArgs>()({
      where,
      include: {
        items: {
          include: {
            requests: {
              where: {
                partnerId,
              },
            },
          },
        },
      },
      orderBy: {
        partnerResponseDeadline: "desc",
      },
    });

    buildQueryWithPagination(query, page, pageSize);

    const [donorOffers, total] = await Promise.all([
      db.donorOffer.findMany(query),
      db.donorOffer.count({ where }),
    ]);

    type DonorOfferWithItems = Prisma.DonorOfferGetPayload<typeof query>;

    const mappedOffers: PartnerDonorOffer[] = donorOffers.map(
      (offer: DonorOfferWithItems) => {
        let state: string | null = null;

        if (
          offer.state === DonorOfferState.ARCHIVED ||
          isAfter(new Date(), offer.partnerResponseDeadline)
        ) {
          state = "closed";
        }

        const requestSubmitted = offer.items.some(
          (item) => item.requests.length > 0
        );

        if (requestSubmitted) {
          state = "submitted";
        } else if (!state) {
          state = "pending";
        }

        return {
          donorOfferId: offer.id,
          offerName: offer.offerName,
          donorName: offer.donorName,
          responseDeadline: offer.partnerResponseDeadline,
          state,
        };
      }
    );

    return {
      donorOffers: mappedOffers,
      total,
    };
  }

  static async getAdminDonorOffers(
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<AdminDonorOffersResponse> {
    const where = buildWhereFromFilters<Prisma.DonorOfferWhereInput>(
      Object.keys(Prisma.DonorOfferScalarFieldEnum),
      filters
    );

    const query = Prisma.validator<Prisma.DonorOfferFindManyArgs>()({
      where,
      include: {
        partnerVisibilities: true,
        items: {
          include: {
            requests: {
              select: {
                partnerId: true,
              },
            },
          },
        },
      },
      orderBy: {
        donorResponseDeadline: "desc",
      },
    });

    buildQueryWithPagination(query, page, pageSize);

    const [donorOffers, total] = await Promise.all([
      db.donorOffer.findMany(query),
      db.donorOffer.count({ where }),
    ]);

    type DonorOfferWithRelations = Prisma.DonorOfferGetPayload<typeof query>;

    const mappedOffers: AdminDonorOffer[] = donorOffers.map(
      (offer: DonorOfferWithRelations) => ({
        donorOfferId: offer.id,
        offerName: offer.offerName,
        donorName: offer.donorName,
        responseDeadline: offer.partnerResponseDeadline,
        donorResponseDeadline: offer.donorResponseDeadline,
        state: offer.state,
        invitedPartners: offer.partnerVisibilities.map((pv) => ({
          name: pv.name,
          responded: offer.items.some((item) =>
            item.requests.some((request) => request.partnerId === pv.id)
          ),
        })),
      })
    );

    return { donorOffers: mappedOffers, total };
  }

  static async getItemRequests(
    itemId: number,
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<GeneralItemRequestsResponse> {
    const filterWhere =
      buildWhereFromFilters<Prisma.GeneralItemRequestWhereInput>(
        Object.keys(Prisma.GeneralItemRequestScalarFieldEnum),
        filters
      );

    const where: Prisma.GeneralItemRequestWhereInput = {
      ...filterWhere,
      generalItemId: itemId,
    };

    const query = Prisma.validator<Prisma.GeneralItemRequestFindManyArgs>()({
      where,
      include: {
        generalItem: true,
        partner: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    buildQueryWithPagination(query, page, pageSize);

    const [requests, total] = await Promise.all([
      db.generalItemRequest.findMany(query),
      db.generalItemRequest.count({ where }),
    ]);

    type GeneralItemRequestWithRelations = Prisma.GeneralItemRequestGetPayload<
      typeof query
    >;

    return { requests: requests as GeneralItemRequestWithRelations[], total };
  }

  static async getGeneralItemLineItems(
    itemId: number,
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<GeneralItemLineItemsResponse> {
    const filterWhere = buildWhereFromFilters<Prisma.LineItemWhereInput>(
      Object.keys(Prisma.LineItemScalarFieldEnum),
      filters
    );

    const where: Prisma.LineItemWhereInput = {
      ...filterWhere,
      generalItemId: itemId,
    };

    const query = Prisma.validator<Prisma.LineItemFindManyArgs>()({
      where,
    });

    buildQueryWithPagination(query, page, pageSize);

    const [items, total] = await Promise.all([
      db.lineItem.findMany(query),
      db.lineItem.count({ where }),
    ]);

    return { items, total };
  }

  static async createDonorOffer(
    formData: FormData,
    parsedFileData: {
      data: Record<string, unknown>[];
      fields: string[];
    } | null,
    preview: boolean
  ): Promise<CreateDonorOfferResult> {
    const offerName = formData.get("offerName") as string;
    const donorName = formData.get("donorName") as string;
    const partnerRequestDeadline = formData.get(
      "partnerRequestDeadline"
    ) as string;
    const donorRequestDeadline = formData.get("donorRequestDeadline") as string;
    const state =
      (formData.get("state") as DonorOfferState) || DonorOfferState.UNFINALIZED;

    const partnerIdStrings = formData.getAll("partnerIds") as string[];
    const partnerIds = partnerIdStrings
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    const partners =
      partnerIds.length > 0
        ? await db.user.findMany({
            where: {
              id: {
                in: partnerIds,
              },
              type: UserType.PARTNER,
              enabled: true,
              pending: false,
            },
            select: {
              id: true,
              email: true,
            },
          })
        : [];

    if (partners.length !== partnerIds.length) {
      throw new ArgumentError(
        "One or more partner IDs are invalid or deactivated"
      );
    }

    if (
      !offerName ||
      !donorName ||
      !partnerRequestDeadline ||
      !donorRequestDeadline
    ) {
      throw new ArgumentError("Missing required donor offer information");
    }

    if (!parsedFileData) {
      throw new ArgumentError("No file data provided");
    }

    const { data: jsonData } = parsedFileData;
    const validDonorOfferItems: (typeof DonorOfferItemSchema._type)[] = [];
    const errors: string[] = [];
    jsonData.forEach((row, index) => {
      const parsed = DonorOfferItemSchema.safeParse(row);
      if (!parsed.success) {
        const errorMessages = parsed.error.issues
          .map((issue) => {
            const field = issue.path.join(".");
            return `Column '${field}': ${issue.message}`;
          })
          .join("; ");
        errors.push(
          `Error validating donor offer item on row ${index + 1}: ${errorMessages}`
        );
      } else {
        validDonorOfferItems.push(parsed.data);
      }
    });

    if (errors.length > 0) {
      return { success: false, errors };
    }

    const donorOfferData: Prisma.DonorOfferCreateInput = {
      offerName,
      donorName,
      partnerResponseDeadline: new Date(partnerRequestDeadline),
      donorResponseDeadline: new Date(donorRequestDeadline),
      state,
      partnerVisibilities: {
        connect: partnerIds.map((id) => ({ id })),
      },
    };

    const donorOfferValidation = DonorOfferSchema.safeParse(donorOfferData);
    if (!donorOfferValidation.success) {
      const errorMessages = donorOfferValidation.error.issues.map((issue) => {
        const field = issue.path.join(".");
        return `Field '${field}': ${issue.message}`;
      });
      return { success: false, errors: errorMessages };
    }

    if (preview) {
      const previewItems =
        DonorOfferService.aggregatePreviewItems(validDonorOfferItems);
      return {
        success: true,
        donorOfferItems: previewItems.slice(0, 8),
      };
    }

    const donorOffer = await db.donorOffer.create({
      data: donorOfferData,
    });

    await db.$transaction(async (tx) => {
      const normalizedItems = DonorOfferService.toGeneralItemCreateInputs(
        validDonorOfferItems,
        donorOffer.id
      );

      const aggregatedItems =
        DonorOfferService.aggregateGeneralItems(normalizedItems);

      if (aggregatedItems.length > 0) {
        await tx.generalItem.createMany({ data: aggregatedItems });
      }
    });

    try {
      const donorOfferItems = await db.generalItem.findMany({
        where: { donorOfferId: donorOffer.id },
        select: { id: true, title: true },
      });

      if (donorOfferItems.length > 0) {
        await MatchingService.add(
          donorOfferItems.map((item) => ({
            generalItemId: item.id,
            donorOfferId: donorOffer.id,
            title: item.title,
          }))
        );
      }
    } catch (error) {
      console.warn(
        "Failed to add embeddings for donor offer general items:",
        error
      );
    }

    NotificationService.createNotifications(
      partners.map((p) => p.id),
      {
        title: "Donor Offer Created",
        action: `${process.env.BASE_URL}/donorOffers/${donorOffer.id}`,
        actionText: "View the Donor Offer",
        template: "DonorOfferCreated",
        payload: {
          offerName,
          donorName,
          partnerResponseDeadline: donorOfferData.partnerResponseDeadline,
          donorResponseDeadline: donorOfferData.donorResponseDeadline,
        },
      }
    );

    return { success: true };
  }

  static async getPartnerDonorOfferDetails(
    donorOfferId: number,
    partnerId: string,
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<DonorOfferItemsRequestsResponse> {
    const partner = await db.user.findUnique({
      where: { id: parseInt(partnerId) },
      select: { enabled: true, pending: true },
    });

    if (!partner?.enabled || partner?.pending) {
      throw new NotFoundError("Partner not found, deactivated, or pending");
    }

    const donorOffer = await db.donorOffer.findUnique({
      where: { id: donorOfferId },
    });

    if (!donorOffer) {
      throw new NotFoundError("Donor offer not found");
    }

    const filterWhere = buildWhereFromFilters<Prisma.GeneralItemWhereInput>(
      Object.keys(Prisma.GeneralItemScalarFieldEnum),
      filters
    );

    const where: Prisma.GeneralItemWhereInput = {
      ...filterWhere,
      donorOfferId,
    };

    const query = Prisma.validator<Prisma.GeneralItemFindManyArgs>()({
      where,
      include: {
        requests: { where: { partnerId: parseInt(partnerId) } },
      },
      orderBy: {
        title: "asc",
      },
    });

    buildQueryWithPagination(query, page, pageSize);

    const [items, total] = await Promise.all([
      db.generalItem.findMany(query),
      db.generalItem.count({ where }),
    ]);

    const donorOfferItemsRequests = items.map(
      (item) =>
        ({
          donorOfferItemId: item.id,
          title: item.title,
          expiration:
            item.expirationDate === null
              ? null
              : format(item.expirationDate, "MM/dd/yyyy"),
          initialQuantity: item.initialQuantity,
          ...(item.requests[0]
            ? {
                requestId: item.requests[0].id,
                quantityRequested: item.requests[0].quantity,
                comments: item.requests[0].comments,
                priority: item.requests[0].priority,
              }
            : {
                requestId: null,
                quantityRequested: 0,
                comments: null,
                priority: null,
              }),
        }) as DonorOfferItemsRequestsDTO
    );

    return {
      donorOfferName: donorOffer.offerName,
      donorOfferItemsRequests,
      total,
    };
  }

  static async getAdminDonorOfferDetails(
    donorOfferId: number,
    requests?: boolean
  ): Promise<{
    donorOffer: DonorOffer;
    partners: Partner[];
    items:
      | GeneralItem[]
      | (GeneralItem & {
          requests?: (GeneralItemRequest & {
            partner: { id: number; name: string };
          })[];
        })[];
  }> {
    const donorOfferRecord = await db.donorOffer.findUnique({
      where: { id: donorOfferId },
      include: {
        partnerVisibilities: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!donorOfferRecord) {
      throw new NotFoundError("Donor offer not found");
    }

    const { partnerVisibilities, ...donorOffer } = donorOfferRecord;

    const shouldIncludeRequests = requests ?? true;

    const orderBy: Prisma.GeneralItemOrderByWithRelationInput[] = shouldIncludeRequests
      ? [
          {
            requests: {
              _count: "desc" as const,
            },
          },
          { id: "asc" as const },
        ]
      : [
          {
            items: {
              _count: "desc" as const,
            },
          },
          { id: "asc" as const },
        ];

    const items = await db.generalItem.findMany({
      where: { donorOfferId },
      include: shouldIncludeRequests
        ? {
            requests: {
              include: {
                partner: { select: { id: true, name: true } },
              },
            },
          }
        : undefined,
      orderBy,
    });

    return {
      donorOffer,
      partners: partnerVisibilities,
      items: items as (GeneralItem & {
        requests?: (GeneralItemRequest & {
          partner: { id: number; name: string };
        })[];
      })[],
    };
  }

  static async createDonorOfferRequests(
    requests: DonorOfferItemsRequestsDTO[],
    partnerId: number
  ): Promise<void> {
    const partner = await db.user.findUnique({
      where: { id: partnerId },
      select: { enabled: true, pending: true },
    });

    if (!partner?.enabled || partner?.pending) {
      throw new NotFoundError("Partner not found, deactivated, or pending");
    }

    if (requests.length > 0) {
      const firstItem = await db.generalItem.findUnique({
        where: { id: requests[0].donorOfferItemId },
        include: {
          donorOffer: {
            select: { partnerResponseDeadline: true, state: true }
          },
          items: {
            where: {
              allocation: null
            },
            select: { id: true }
          }
        }
      });

      if (!firstItem) {
        throw new NotFoundError("General item not found");
      }

      if (firstItem.donorOffer?.state === "ARCHIVED") {
        if (firstItem.items.length === 0) {
          throw new ArgumentError("Cannot create requests for fully allocated archived items.");
        }
      }
      else if (firstItem.donorOffer?.state === "UNFINALIZED") {
        if (firstItem.donorOffer.partnerResponseDeadline) {
          const now = new Date();
          if (now > firstItem.donorOffer.partnerResponseDeadline) {
            throw new ArgumentError("Cannot create or update requests after the partner response deadline has passed.");
          }
        }
      }
    }

    await db.$transaction(async (tx) => {
      await Promise.all(
        requests.map((item) => {
          const priority =
            (item.priority as string) === ""
              ? null
              : (item.priority as RequestPriority);

          return tx.generalItemRequest.upsert({
            where: {
              generalItemId_partnerId: {
                generalItemId: item.donorOfferItemId,
                partnerId: partnerId,
              },
            },
            update: {
              quantity: item.quantityRequested,
              finalQuantity: item.quantityRequested,
              comments: item.comments,
              priority: priority,
            },
            create: {
              generalItemId: item.donorOfferItemId,
              partnerId: partnerId,
              quantity: item.quantityRequested,
              finalQuantity: item.quantityRequested,
              comments: item.comments,
              priority: priority,
            },
          });
        })
      );
    });
  }

  static async updateDonorOfferRequests(
    donorOfferId: number,
    requests: UpdateRequestItem[]
  ): Promise<void> {
    await db.$transaction(async (tx) => {
      await Promise.all(
        requests.map(async (itemRequest) => {
          const donorOfferItem = await tx.generalItem.findFirst({
            where: {
              donorOfferId: donorOfferId,
              title: itemRequest.title,
              expirationDate: itemRequest.expirationDate,
              unitType: itemRequest.unitType,
            },
          });

          if (!donorOfferItem) {
            console.log(
              `Couldn't find matching donor offer item: ${itemRequest.title}`
            );
            return;
          }

          await tx.generalItem.update({
            where: {
              id: donorOfferItem.id,
            },
            data: {
              requestQuantity: itemRequest.quantity || 0,
            },
          });
        })
      );
    });
  }

  static async updateRequestFinalQuantity(
    requestId: number,
    finalQuantity: number
  ): Promise<void> {
    await db.generalItemRequest.update({
      where: { id: requestId },
      data: { finalQuantity },
    });
  }

  static async getFinalizeDetails(
    donorOfferId: number
  ): Promise<FinalizeDetailsResult> {
    const donorOffer = await db.donorOffer.findUnique({
      where: { id: donorOfferId },
      include: {
        partnerVisibilities: true,
      },
    });

    if (!donorOffer) {
      throw new NotFoundError("Donor offer not found");
    }

    const formatDate = (date: Date | null) => {
      if (!date) return "";
      return date.toISOString().split("T")[0];
    };

    return {
      offerName: donorOffer.offerName,
      donorName: donorOffer.donorName,
      partnerRequestDeadline: formatDate(donorOffer.partnerResponseDeadline),
      donorRequestDeadline: formatDate(donorOffer.donorResponseDeadline),
      partners: donorOffer.partnerVisibilities.map((visibility) => ({
        id: visibility.id,
        name: visibility.name,
      })),
    };
  }

  static async finalizeDonorOffer(
    donorOfferId: number,
    parsedFileData: {
      data: Record<string, unknown>[];
      fields: string[];
    },
    preview: boolean,
    embeddingCache: import("./matchingService").EmbeddingCache
  ): Promise<FinalizeDonorOfferResult> {
    const donorOffer = await db.donorOffer.findUnique({
      where: { id: donorOfferId },
      include: {
        partnerVisibilities: true,
      },
    });

    if (!donorOffer) {
      throw new NotFoundError("Donor offer not found");
    }

    const { data: jsonData } = parsedFileData;
    const validationResults = jsonData.map((row, index) => {
      const result = FinalizeDonorOfferItemSchema.safeParse(row);
      if (!result.success) {
        const errorMessages = result.error.issues.map((issue) => {
          const field = issue.path.join(".");
          return `Row ${index + 1}, Field '${field}': ${issue.message}`;
        });
        return { valid: false, errors: errorMessages };
      }
      return { valid: true, data: result.data };
    });

    const invalidRows = validationResults.filter((r) => !r.valid);
    if (invalidRows.length > 0) {
      return {
        success: false,
        errors: invalidRows.flatMap((r) => r.errors as string[]),
      };
    }

    const validItems = validationResults
      .filter(
        (r): r is { valid: true; data: FinalizeDonorOfferItem } => r.valid
      )
      .map((r) => r.data);

    if (preview) {
      const previewItems = validItems.slice(0, 8).map((item) => ({
        ...item,
      }));

      return {
        success: true,
        donorOfferId,
        createdCount: previewItems.length,
        donorOfferItems: previewItems,
      };
    }

    const updatedOffer = await db.donorOffer.update({
      where: { id: donorOfferId },
      data: { state: $Enums.DonorOfferState.FINALIZED },
      include: { items: true },
    });

    if (validItems.length > 0) {
      try {
        await MatchingService.loadDonorOfferEmbeddings(
          donorOfferId,
          embeddingCache
        );
      } catch (error) {
        console.warn(
          "Failed to load embeddings for matching, falling back to exact matching:",
          error
        );
      }

      const lineItemsByGeneralItem = new Map<
        string,
        FinalizeDonorOfferItem[]
      >();

      for (const item of validItems) {
        const normalizedExpiration = DonorOfferService.normalizeExpirationDate(
          item.expirationDate
        );
        const expirationKey = normalizedExpiration
          ? normalizedExpiration.toISOString().split("T")[0]
          : "null";
        const key = `${DonorOfferService.normalizeWhitespace(item.title)}|${expirationKey}|${DonorOfferService.normalizeWhitespace(item.unitType)}`;

        if (!lineItemsByGeneralItem.has(key)) {
          lineItemsByGeneralItem.set(key, []);
        }
        lineItemsByGeneralItem.get(key)!.push(item);
      }

      const offerItems: typeof updatedOffer.items = [...updatedOffer.items];

      for (const [, lineItems] of lineItemsByGeneralItem.entries()) {
        const firstLineItem = lineItems[0];
        const normalizedExpiration = DonorOfferService.normalizeExpirationDate(
          firstLineItem.expirationDate
        );

        let generalItem: typeof offerItems[0] | undefined;
        try {
          const query = firstLineItem.title;
          const embeddingMatch = await MatchingService.findSimilarFromCache(
            donorOfferId,
            query,
            embeddingCache,
            {
              unitType: firstLineItem.unitType,
              expirationDate: normalizedExpiration,
              expirationTolerance: 1,
            },
            0.20
          );
          console.log(generalItem?.title, embeddingMatch?.title);

          if (embeddingMatch?.generalItemId) {
            generalItem = offerItems.find((di) => di.id === embeddingMatch.generalItemId);
          }
        } catch (error) {
          console.warn("Embedding matching failed, falling back to exact matching:", error);
        }

        if (!generalItem) {
          generalItem = offerItems.find((di) => {
            const diExpiration = di.expirationDate
              ? DonorOfferService.normalizeExpirationDate(di.expirationDate)
              : null;
            const expirationMatches = DonorOfferService.datesWithinTolerance(
              normalizedExpiration,
              diExpiration,
              1
            );
            return (
              DonorOfferService.normalizeForComparison(firstLineItem.title) ===
                DonorOfferService.normalizeForComparison(di.title) &&
              expirationMatches &&
              DonorOfferService.normalizeForComparison(firstLineItem.unitType) ===
                DonorOfferService.normalizeForComparison(di.unitType)
            );
          });
        }

        if (!generalItem) {
          const totalQuantity = lineItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          );

          let weight = firstLineItem.weight;
          if (!weight || weight === 0) {
            const similarItem = offerItems.find(
              (item) =>
                DonorOfferService.normalizeWhitespace(item.title) ===
                  DonorOfferService.normalizeWhitespace(firstLineItem.title) &&
                DonorOfferService.normalizeWhitespace(item.unitType) ===
                  DonorOfferService.normalizeWhitespace(firstLineItem.unitType) &&
                Number(item.weight) > 0
            );
            weight = similarItem ? Number(similarItem.weight) : 0;
          }

          const createData: Prisma.GeneralItemCreateInput = {
            donorOffer: { connect: { id: donorOfferId } },
            title: DonorOfferService.normalizeWhitespace(firstLineItem.title),
            expirationDate: normalizedExpiration,
            unitType: DonorOfferService.normalizeWhitespace(
              firstLineItem.unitType
            ),
            initialQuantity: totalQuantity,
            description: null,
            weight,
          };

          generalItem = await db.generalItem.create({
            data: createData,
          });

          offerItems.push(generalItem);

          try {
            await MatchingService.add({
              generalItemId: generalItem.id,
              donorOfferId,
              title: generalItem.title,
            });
          } catch (error) {
            console.warn(
              "Failed to generate embedding for new general item:",
              error
            );
          }
        }

        const generalItemId = generalItem.id;
        console.log(generalItemId, generalItem.title);

        const lineItemsToCreate: Prisma.LineItemCreateManyInput[] = lineItems.map(
          (item) => ({
            allowAllocations: item.allowAllocations ?? true,
            visible: item.visible ?? true,
            gik: item.gik ?? true,
            donorName: item.donorName || updatedOffer.donorName,
            quantity: item.quantity,
            lotNumber: item.lotNumber,
            palletNumber: item.palletNumber,
            boxNumber: item.boxNumber,
            unitPrice: item.unitPrice,
            maxRequestLimit: item.maxRequestLimit ?? null,
            donorShippingNumber: item.donorShippingNumber ?? null,
            hfhShippingNumber: item.hfhShippingNumber ?? null,
            ndc: item.ndc ?? null,
            notes: null,
            generalItemId,
          })
        );

        await db.lineItem.createMany({ data: lineItemsToCreate });
      }

    }

    await db.generalItem.deleteMany({
      where: {
        donorOfferId,
        items: { none: {} },
        requests: { none: {} },
      },
    });

    return { success: true, donorOfferId, createdCount: validItems.length };
  }

  static async updateDonorOffer(
    donorOfferId: number,
    updateData: Partial<Omit<DonorOfferUpdateParams, "id">>
  ) {
    const existingOffer = await db.donorOffer.findUnique({
      where: { id: donorOfferId },
      include: {
        partnerVisibilities: {
          select: { id: true },
        },
      },
    });

    if (!existingOffer) {
      throw new NotFoundError("Donor offer not found");
    }

    if (existingOffer.state === DonorOfferState.ARCHIVED) {
      const isOnlyChangingState =
        Object.keys(updateData).length === 1 && updateData.state !== undefined;

      if (!isOnlyChangingState) {
        throw new ArgumentError(
          "Cannot edit an archived donor offer. Archived offers are read-only."
        );
      }
    }

    const existingPartnerIds = new Set(
      existingOffer.partnerVisibilities.map((partner) => partner.id)
    );

    const addedPartnerIds =
      updateData.partners?.filter((id) => !existingPartnerIds.has(id)) ?? [];

    let newPartners: { id: number; name: string; email: string }[] = [];

    if (addedPartnerIds.length > 0) {
      newPartners = await db.user.findMany({
        where: {
          id: { in: addedPartnerIds },
          enabled: true,
          pending: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (newPartners.length !== addedPartnerIds.length) {
        const foundIds = newPartners.map((p) => p.id);
        const missingIds = addedPartnerIds.filter(
          (id) => !foundIds.includes(id)
        );
        throw new ArgumentError(
          `One or more partner IDs are invalid or deactivated: ${missingIds.join(", ")}`
        );
      }
    }

    const update: Prisma.DonorOfferUpdateInput = {
      offerName: updateData.offerName,
      donorName: updateData.donorName,
      partnerResponseDeadline: updateData.partnerResponseDeadline,
      donorResponseDeadline: updateData.donorResponseDeadline,
      ...(addedPartnerIds !== undefined
        ? {
            partnerVisibilities: {
              connect: addedPartnerIds.map((partnerId) => ({ id: partnerId })),
            },
          }
        : {}),
      state: updateData.state,
    };

    const updatedOffer = await db.donorOffer.update({
      where: { id: donorOfferId },
      data: update,
    });

    if (addedPartnerIds.length > 0) {
      NotificationService.createNotifications(
        newPartners.map((p) => p.id),
        {
          title: "Donor Offer Created",
          action: `${process.env.BASE_URL}/donorOffers/${donorOfferId}`,
          actionText: "View the Donor Offer",
          template: "DonorOfferCreated",
          payload: {
            offerName: updatedOffer.offerName,
            donorName: updatedOffer.donorName,
            partnerResponseDeadline: updatedOffer.partnerResponseDeadline,
            donorResponseDeadline: updatedOffer.donorResponseDeadline,
          },
        }
      );
    }

    return updatedOffer;
  }

  static async archiveDonorOffer(donorOfferId: number): Promise<void> {
    await db.donorOffer.update({
      where: { id: donorOfferId },
      data: { state: DonorOfferState.ARCHIVED },
    });
  }

  static async deleteDonorOffer(donorOfferId: number): Promise<void> {
    try {
      const existingOffer = await db.donorOffer.findUnique({
        where: { id: donorOfferId },
      });

      if (existingOffer?.state === DonorOfferState.ARCHIVED) {
        throw new ArgumentError(
          "Cannot delete an archived donor offer. Archived offers are read-only."
        );
      }

      await db.donorOffer.delete({ where: { id: donorOfferId } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return;
      }

      throw error;
    }
  }

  static async getAllocationItems(
    donorOfferId: number,
    filters?: Filters,
    page?: number,
    pageSize?: number
  ) {
    const filterWhere = buildWhereFromFilters<Prisma.GeneralItemWhereInput>(
      Object.keys(Prisma.GeneralItemScalarFieldEnum),
      filters
    );

    const where: Prisma.GeneralItemWhereInput = {
      ...filterWhere,
      donorOfferId,
      items: { some: {} },
    };

    const query: Prisma.GeneralItemFindManyArgs = {
      where,
      include: {
        items: {
          include: {
            allocation: {
              include: {
                partner: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            id: "asc",
          },
        },
        requests: {
          include: {
            partner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            id: "asc",
          },
        },
      },
      orderBy: [
        {
          items: {
            _count: "desc",
          },
        },
        { id: "asc" },
      ],
    };

    buildQueryWithPagination(query, page, pageSize);

    const [items, total, orphanedGeneralItems, targetOptions] = await Promise.all([
      db.generalItem.findMany(query),
      db.generalItem.count({ where }),
      db.generalItem.findMany({
        where: {
          donorOfferId,
          items: { none: {} },
          requests: { some: {} },
        },
        include: {
          requests: {
            include: {
              partner: {
                select: { id: true, name: true },
              },
            },
            orderBy: { id: "asc" },
          },
        },
        orderBy: { id: "asc" },
      }),
      db.generalItem.findMany({
        where: {
          donorOfferId,
          items: { some: {} },
        },
        select: {
          id: true,
          title: true,
          unitType: true,
          expirationDate: true,
          requests: {
            include: {
              partner: {
                select: { id: true, name: true },
              },
            },
          },
          items: {
            include: {
              allocation: {
                include: {
                  partner: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { title: "asc" },
      }),
    ]);

    type ItemWithItems = Prisma.GeneralItemGetPayload<{
      include: {
        items: true;
        requests: {
          include: {
            partner: {
              select: { id: true; name: true };
            };
          };
        };
      };
    }>;

    return {
      items: (items as ItemWithItems[]).map((item) => {
        const quantity = item.items.reduce(
          (sum: number, lineItem: { quantity: number }) =>
            sum + lineItem.quantity,
          0
        );
        return {
          ...item,
          quantity,
        };
      }),
      total,
      orphanedRequests: orphanedGeneralItems.flatMap((generalItem) =>
        generalItem.requests.map((request) => ({
          requestId: request.id,
          generalItemId: generalItem.id,
          generalItemTitle: generalItem.title,
          partner: request.partner,
          quantity: request.quantity,
          finalQuantity: request.finalQuantity,
        }))
      ),
      generalItemOptions: targetOptions.map((option) => {
        const partnerAllocations = option.requests.map((request) => {
          const allocatedQuantity = option.items
            .filter(
              (item) => item.allocation?.partner?.id === request.partnerId
            )
            .reduce((sum, item) => sum + item.quantity, 0);

          return {
            partnerId: request.partnerId,
            partnerName: request.partner.name,
            allocatedQuantity,
            requestedQuantity: request.quantity,
            finalRequestedQuantity: request.finalQuantity,
          };
        });

        return {
          id: option.id,
          title: option.title,
          unitType: option.unitType,
          expirationDate: option.expirationDate,
          partnerAllocations,
        };
      }),
    };
  }

  static async getDonorOfferGeneralItemIds(id: number) {
    return db.donorOffer.findUnique({
      where: { id },
      select: {
        items: {
          select: { id: true },
        },
      },
    });
  }
}

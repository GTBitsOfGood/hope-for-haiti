import { db } from "@/db";
import { EmailClient } from "@/email";
import {
  DonorOfferState,
  UserType,
  RequestPriority,
  ItemCategory,
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
});

const DonorOfferSchema = z.object({
  offerName: z.string().trim().min(1, "Offer name is required"),
  donorName: z.string().trim().min(1, "Donor name is required"),
  partnerResponseDeadline: z.coerce.date(),
  donorResponseDeadline: z.coerce.date(),
  state: z.nativeEnum(DonorOfferState).default(DonorOfferState.UNFINALIZED),
});

const FinalizeDonorOfferItemSchema = z.object({
  // not in schema, but used to match to generalItem
  title: z.string(),
  unitType: z.string(),
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
  // end 
  category: z.nativeEnum(ItemCategory).optional(),
  quantity: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : Number(val)))
    .pipe(z.number().int().min(0, "Quantity must be non-negative")),
  lotNumber: z.string(),
  palletNumber: z.string(),
  boxNumber: z.string(),
  donorShippingNumber: z.string().optional(),
  hfhShippingNumber: z.string().optional(),
  // have to consider $
  unitPrice: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : Number(val.trim().replace("$", "").replace(/,/g, ""))))
    .pipe(z.number().min(0)),
  maxRequestLimit: z.string().optional(),
  ndc: z.string().optional(),
  visible: z
    .string()
    .optional()
    .transform((val) => (val || "false").toLowerCase())
    .refine((val) => val === "true" || val === "false", {
      message: "Invalid boolean value",
    })
    .transform((val) => val === "true"),
  allowAllocations: z
    .string()
    .optional()
    .transform((val) => (val || "true").toLowerCase())
    .refine((val) => val === "true" || val === "false", {
      message: "Invalid boolean value",
    })
    .transform((val) => val === "true"),
  gik: z
    .string()
    .optional()
    .transform((val) => (val || "true").toLowerCase())
    .refine((val) => val === "true" || val === "false", {
      message: "Invalid boolean value",
    })
    .transform((val) => val === "true"),
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

  private static toGeneralItemCreateInputs(
    items: (typeof DonorOfferItemSchema._type)[],
    donorOfferId: number
  ): Prisma.GeneralItemCreateManyInput[] {
    return items.map((item) => ({
      donorOfferId,
      title: item.title,
      expirationDate:
        DonorOfferService.normalizeExpirationDate(item.expirationDate) ?? null,
      unitType: item.unitType,
      initialQuantity: item.initialQuantity,
      description:
        item.description && item.description.length > 0
          ? item.description
          : null,
    }));
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
          : item.expirationDate ?? "null",
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
    }));
  }

  static async getPartnerDonorOffers(
    partnerId: number,
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<PartnerDonorOffersResponse> {
    const filterWhere = buildWhereFromFilters<Prisma.DonorOfferWhereInput>(
      Object.keys(Prisma.DonorOfferScalarFieldEnum),
      filters
    );

    const where: Prisma.DonorOfferWhereInput = {
      ...filterWhere,
      partnerVisibilities: {
        some: {
          id: partnerId,
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

    if (partnerIds.length > 0) {
      const partners = await db.user.findMany({
        where: {
          id: {
            in: partnerIds,
          },
          type: UserType.PARTNER,
        },
        select: {
          id: true,
        },
      });

      if (partners.length !== partnerIds.length) {
        throw new ArgumentError("One or more partner IDs are invalid");
      }
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

    await db.$transaction(async (tx) => {
      const donorOffer = await tx.donorOffer.create({
        data: donorOfferData,
      });

      const normalizedItems =
        DonorOfferService.toGeneralItemCreateInputs(
          validDonorOfferItems,
          donorOffer.id
        );

      const aggregatedItems =
        DonorOfferService.aggregateGeneralItems(normalizedItems);

      if (aggregatedItems.length > 0) {
        await tx.generalItem.createMany({ data: aggregatedItems });
      }
    });

    return { success: true };
  }

  static async getPartnerDonorOfferDetails(
    donorOfferId: number,
    partnerId: string,
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<DonorOfferItemsRequestsResponse> {
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
    donorOffer: DonorOffer
    partners: Partner[];
    items: GeneralItem[] | (GeneralItem & {
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
    preview: boolean
  ): Promise<FinalizeDonorOfferResult> {
    const donorOffer = await db.donorOffer.findUnique({
      where: { id: donorOfferId },
      include: {
        partnerVisibilities: true,
      },
    });

    if (!donorOffer) {
      throw new NotFoundError("Donor offer not found")
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

    await db.$transaction(async (tx) => {
      const donorOffer = await tx.donorOffer.update({
        where: { id: donorOfferId },
        data: {
          state: $Enums.DonorOfferState.FINALIZED,
        },
        include: { items: true },
      });

      if (validItems.length > 0) {
        const itemsWithDonorOfferItemId = validItems.map((item) => ({
          // TODO: removed in future 
          allowAllocations: true,
          visible: true,
          gik: true,
          //
          donorName: donorOffer.donorName,
          quantity: item.quantity,
          lotNumber: item.lotNumber,
          palletNumber: item.palletNumber,
          boxNumber: item.boxNumber,
          unitPrice: item.unitPrice,
          generalItemId: donorOffer.items.find((di) => {
            const itemExpiration =
              DonorOfferService.normalizeExpirationDate(
                item.expirationDate
              );
            const diExpiration = di.expirationDate
              ? DonorOfferService.normalizeExpirationDate(di.expirationDate)
              : null;
            const expirationMatches =
              itemExpiration === null && diExpiration === null
                ? true
                : !!itemExpiration &&
                  !!diExpiration &&
                  itemExpiration.getTime() === diExpiration.getTime();
            return (
              item.title === di.title &&
              expirationMatches &&
              item.unitType === di.unitType
            );
          })?.id,
        }));

        await tx.lineItem.createMany({ data: itemsWithDonorOfferItemId });
      }
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

    const existingPartnerIds = new Set(existingOffer.partnerVisibilities.map((partner) => partner.id));

    const addedPartnerIds = updateData.partners?.filter(id => !existingPartnerIds.has(id)) ?? [];

    let newPartners: { id: number; name: string; email: string }[] = [];

    if (addedPartnerIds.length > 0) {
      newPartners = await db.user.findMany({
        where: {
          id: { in: addedPartnerIds },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (newPartners.length !== addedPartnerIds.length) {
        throw new ArgumentError("One or more partner IDs are invalid");
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
      const generalItems = await db.generalItem.findMany({
        where: { donorOfferId },
        select: {
          title: true,
          description: true,
          expirationDate: true,
          unitType: true,
          initialQuantity: true,
          requestQuantity: true,
        },
      });

      const emails = newPartners.map(partner => partner.email);

      EmailClient.sendDonorOfferCreated(emails, {
        offerName: updatedOffer.offerName,
        donorName: updatedOffer.donorName,
        partnerResponseDeadline: updatedOffer.partnerResponseDeadline,
        donorResponseDeadline: updatedOffer.donorResponseDeadline,
        offerUrl: `${process.env.BASE_URL}/donorOffers/${donorOfferId}`,
        items: generalItems,
      });
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
      orderBy: {
        id: "asc",
      },
    };

    buildQueryWithPagination(query, page, pageSize);

    const [items, total] = await Promise.all([
      db.generalItem.findMany(query),
      db.generalItem.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        quantity: item.initialQuantity,
      })),
      total,
    };
  }
}

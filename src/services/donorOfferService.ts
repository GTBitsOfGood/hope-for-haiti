import { db } from "@/db";
import { DonorOfferState, UserType, RequestPriority, ItemCategory, Item, DonorOffer, DonorOfferItem, DonorOfferItemRequest } from "@prisma/client";
import { isAfter } from "date-fns";
import { z } from "zod";
import { format } from "date-fns";
import { ArgumentError, NotFoundError } from "@/util/errors";
import {
  PartnerDonorOffer,
  AdminDonorOffer,
  ItemRequestWithAllocations,
  CreateDonorOfferResult,
  DonorOfferItemsRequestsDTO,
  DonorOfferItemsRequestsResponse,
  UpdateRequestItem,
  FinalizeDetailsResult,
  FinalizeDonorOfferResult,
  DonorOfferEditDetails
} from "@/types/api/donorOffer.types";

const DonorOfferItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string(),
  quantity: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : Number(val)))
    .pipe(z.number().int().min(0, "Quantity must be non-negative")),
  expirationDate: z
    .union([
      z.coerce.date(),
      z.string().transform((val) => (val.trim() === "" ? undefined : val)),
    ])
    .optional(),
  unitType: z.string(),
  quantityPerUnit: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : Number(val)))
    .pipe(z.number().int().min(0, "Quantity must be non-negative")),
});

const DonorOfferSchema = z.object({
  offerName: z.string().min(1, "Offer name is required"),
  donorName: z.string().min(1, "Donor name is required"),
  partnerResponseDeadline: z.coerce.date(),
  donorResponseDeadline: z.coerce.date(),
  state: z.nativeEnum(DonorOfferState).default(DonorOfferState.UNFINALIZED),
});



const FinalizeDonorOfferItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string(),
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
    })
    .optional(),
  unitType: z.string(),
  quantityPerUnit: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : Number(val)))
    .pipe(z.number().int().min(0, "Quantity must be non-negative")),
  category: z.nativeEnum(ItemCategory),
  quantity: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : Number(val)))
    .pipe(z.number().int().min(0, "Quantity must be non-negative")),
  datePosted: z.coerce.date(),
  lotNumber: z.string(),
  palletNumber: z.string(),
  boxNumber: z.string(),
  donorShippingNumber: z.string(),
  hfhShippingNumber: z.string(),
  unitPrice: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : Number(val)))
    .pipe(z.number().min(0)),
  maxRequestLimit: z.string(),
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

const FinalizeDonorOfferSchema = z.object({
  partnerResponseDeadline: z.date(),
  donorResponseDeadline: z.date(),
  state: z.nativeEnum(DonorOfferState).default(DonorOfferState.FINALIZED),
});

type FinalizeDonorOfferItem = z.infer<typeof FinalizeDonorOfferItemSchema>;



export default class DonorOfferService {
  static async getPartnerDonorOffers(partnerId: number): Promise<PartnerDonorOffer[]> {
    const donorOffers = await db.donorOffer.findMany({
      where: {
        partnerVisibilities: {
          some: {
            partnerId,
          },
        },
      },
      include: {
        items: {
          include: {
            requests: {
              where: {
                partnerId: partnerId,
              },
            },
          },
        },
      },
    });

    return donorOffers.map((offer) => {
      let state = null;

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
      } else {
        state = "pending";
      }
      
      return {
        donorOfferId: offer.id,
        offerName: offer.offerName,
        donorName: offer.donorName,
        responseDeadline: offer.partnerResponseDeadline,
        state: state,
      };
    });
  }

  static async getAdminDonorOffers(): Promise<AdminDonorOffer[]> {
    const donorOffers = await db.donorOffer.findMany({
      include: {
        partnerVisibilities: {
          include: {
            partner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
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
    });

    return donorOffers.map((offer) => ({
      donorOfferId: offer.id,
      offerName: offer.offerName,
      donorName: offer.donorName,
      responseDeadline: offer.partnerResponseDeadline,
      state: offer.state,
      invitedPartners: offer.partnerVisibilities.map((pv) => ({
        name: pv.partner.name,
        responded: offer.items.some((item) =>
          item.requests.some((request) => request.partnerId === pv.partnerId)
        ),
      })),
    }));
  }

  static async getItemRequests(itemId: number): Promise<ItemRequestWithAllocations[]> {
    const requests = await db.donorOfferItemRequest.findMany({
      where: { donorOfferItemId: itemId },
      include: {
        donorOfferItem: true,
        partner: {
          select: {
            name: true,
          },
        },
      },
    });

    const allocations = await Promise.all(
      requests.map(async (request) => {
        return await db.donorOfferItemRequestAllocation.findMany({
          where: {
            donorOfferItemRequestId: request.id,
          },
          include: {
            item: true,
          },
        });
      })
    );

    return requests.map((request, index) => ({
      ...request,
      allocations: allocations[index],
    }));
  }

  static async getItemLineItems(itemId: number): Promise<Item[]> {
    const donorOfferItem = await db.donorOfferItem.findUnique({
      where: {
        id: itemId,
      },
      select: {
        items: true,
      },
    });

    return donorOfferItem?.items ?? [];
  }

  static async createDonorOffer(
    formData: FormData, 
    parsedFileData: { data: Record<string, unknown>[]; fields: string[] } | null, 
    preview: boolean
  ): Promise<CreateDonorOfferResult> {
    const offerName = formData.get("offerName") as string;
    const donorName = formData.get("donorName") as string;
    const partnerRequestDeadline = formData.get("partnerRequestDeadline") as string;
    const donorRequestDeadline = formData.get("donorRequestDeadline") as string;
    const state = (formData.get("state") as DonorOfferState) || DonorOfferState.UNFINALIZED;

    const partnerIdStrings = formData.getAll("partnerIds") as string[];
    const partnerIds = partnerIdStrings
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    if (!offerName || !donorName || !partnerRequestDeadline || !donorRequestDeadline) {
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

    const donorOfferData = {
      offerName,
      donorName,
      partnerResponseDeadline: new Date(partnerRequestDeadline),
      donorResponseDeadline: new Date(donorRequestDeadline),
      state,
    };

    const donorOfferValidation = DonorOfferSchema.safeParse(donorOfferData);
    if (!donorOfferValidation.success) {
      const errorMessages = donorOfferValidation.error.issues
        .map((issue) => {
          const field = issue.path.join(".");
          return `Field '${field}': ${issue.message}`;
        })
      return { success: false, errors: errorMessages };
    }

    if (preview) {
      return { 
        success: true, 
        donorOfferItems: validDonorOfferItems.slice(0, 8) 
      };
    }

    await db.$transaction(async (tx) => {
      const donorOffer = await tx.donorOffer.create({
        data: donorOfferData,
      });

      const itemsWithDonorOfferId = validDonorOfferItems.map((item) => ({
        ...item,
        donorOfferId: donorOffer.id,
      }));

      await tx.donorOfferItem.createMany({ data: itemsWithDonorOfferId });

      if (partnerIds.length > 0) {
        const partners = await tx.user.findMany({
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

        await tx.donorOfferPartnerVisibility.createMany({
          data: partnerIds.map((partnerId) => ({
            donorOfferId: donorOffer.id,
            partnerId: partnerId,
          })),
        });
      }
    });

    return { success: true };
  }

  static async getPartnerDonorOfferDetails(donorOfferId: number, partnerId: string): Promise<DonorOfferItemsRequestsResponse> {
    const donorOffer = await db.donorOffer.findUnique({
      where: { id: donorOfferId },
    });
    
    if (!donorOffer) {
      throw new NotFoundError("Donor offer not found");
    }

    const donorOfferItemsRequests = (
      await db.donorOfferItem.findMany({
        where: { donorOfferId },
        include: {
          requests: { where: { partnerId: parseInt(partnerId) } },
        },
      })
    ).map(
      (item) =>
        ({
          donorOfferItemId: item.id,
          title: item.title,
          type: item.type,
          expiration:
            item.expirationDate === null
              ? null
              : format(item.expirationDate, "MM/dd/yyyy"),
          quantity: item.quantity,
          unitSize: item.quantityPerUnit,
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
    };
  }

  static async getAdminDonorOfferDetails(donorOfferId: number): Promise<{ donorOffer: DonorOffer; itemsWithRequests: (DonorOfferItem & { requests: (DonorOfferItemRequest & { partner: { name: string } })[] })[] }> {
    const donorOffer = await db.donorOffer.findUnique({
      where: { id: donorOfferId },
    });

    if (!donorOffer) {
      throw new NotFoundError("Donor offer not found");
    }

    const itemsWithRequests = await db.donorOfferItem.findMany({
      where: { donorOfferId },
      include: { requests: { include: { partner: { select: { name: true } } } } },
    });
    
    return {
      donorOffer,
      itemsWithRequests,
    };
  }

  static async createDonorOfferRequests(requests: DonorOfferItemsRequestsDTO[], partnerId: number): Promise<void> {
    await db.$transaction(async (tx) => {
      await Promise.all(
        requests.map((item) => {
          const priority = (item.priority as string) === "" ? null : (item.priority as RequestPriority);

          return tx.donorOfferItemRequest.upsert({
            where: {
              donorOfferItemId_partnerId: {
                donorOfferItemId: item.donorOfferItemId,
                partnerId: partnerId,
              },
            },
            update: {
              quantity: item.quantityRequested,
              comments: item.comments,
              priority: priority,
            },
            create: {
              donorOfferItemId: item.donorOfferItemId,
              partnerId: partnerId,
              quantity: item.quantityRequested,
              comments: item.comments,
              priority: priority,
            },
          });
        })
      );
    });
  }

  static async updateDonorOfferRequests(donorOfferId: number, requests: UpdateRequestItem[]): Promise<void> {
    await db.$transaction(async (tx) => {
      await Promise.all(
        requests.map(async (itemRequest) => {
          const donorOfferItem = await tx.donorOfferItem.findFirst({
            where: {
              donorOfferId: donorOfferId,
              title: itemRequest.title,
              type: itemRequest.type,
              expirationDate: itemRequest.expirationDate,
              unitType: itemRequest.unitType,
            },
          });

          if (!donorOfferItem) {
            console.log(`Couldn't find matching donor offer item: ${itemRequest.title}`);
            return;
          }

          await tx.donorOfferItem.update({
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

  static async getFinalizeDetails(donorOfferId: number): Promise<FinalizeDetailsResult> {
    const donorOffer = await db.donorOffer.findUnique({
      where: { id: donorOfferId },
      include: {
        partnerVisibilities: {
          include: {
            partner: true,
          },
        },
      },
    });

    if (!donorOffer) {
      throw new NotFoundError("Donor offer not found");
    }

    const formatDate = (date: Date | null) => {
      if (!date) return "";
      return date.toISOString().split("T")[0];
    };

    console.log(donorOffer);

    return {
      offerName: donorOffer.offerName,
      donorName: donorOffer.donorName,
      partnerRequestDeadline: formatDate(donorOffer.partnerResponseDeadline),
      donorRequestDeadline: formatDate(donorOffer.donorResponseDeadline),
      partners: donorOffer.partnerVisibilities.map((visibility) => ({
        id: visibility.partner.id,
        name: visibility.partner.name,
      })),
    };
  }

  static async finalizeDonorOffer(
    donorOfferId: number,
    formData: FormData,
    parsedFileData: { data: Record<string, unknown>[]; fields: string[] } | null,
    preview: boolean
  ): Promise<FinalizeDonorOfferResult> {
    const partnerRequestDeadline = formData.get("partnerRequestDeadline") as string;
    const donorRequestDeadline = formData.get("donorRequestDeadline") as string;
    const state = (formData.get("state") as DonorOfferState) || DonorOfferState.FINALIZED;

    const partnerIds: number[] = [];
    formData.getAll("partnerIds").forEach((id) => {
      const parsedId = parseInt(id as string);
      if (!isNaN(parsedId)) partnerIds.push(parsedId);
    });

    if (!partnerRequestDeadline || !donorRequestDeadline) {
      throw new ArgumentError("Partner request deadline and donor request deadline are required");
    }

    const partnerDeadline = new Date(partnerRequestDeadline);
    const donorDeadline = new Date(donorRequestDeadline);
    if (isNaN(partnerDeadline.getTime()) || isNaN(donorDeadline.getTime())) {
      throw new ArgumentError("Invalid date format for deadlines");
    }

    const donorOfferData = {
      partnerResponseDeadline: partnerDeadline,
      donorResponseDeadline: donorDeadline,
      state,
    };

    const validation = FinalizeDonorOfferSchema.safeParse(donorOfferData);
    if (!validation.success) {
      const errorMessages = validation.error.issues
        .map((issue) => {
          const field = issue.path.join(".");
          return `Field '${field}': ${issue.message}`;
        })
        .join("; ");
      throw new ArgumentError(`Error validating donor offer: ${errorMessages}`);
    }

    let validItems: FinalizeDonorOfferItem[] = [];

    if (parsedFileData) {
      const { data: jsonData } = parsedFileData;
      const validationResults = jsonData.map((row, index) => {
        const result = FinalizeDonorOfferItemSchema.safeParse(row);
        if (!result.success) {
          const errorMessages = result.error.issues
            .map((issue) => {
              const field = issue.path.join(".");
              return `Row ${index + 1}, Field '${field}': ${issue.message}`;
            });
          return { valid: false, errors: errorMessages };
        }
        return { valid: true, data: result.data };
      });

      const invalidRows = validationResults.filter((r) => !r.valid);
      if (invalidRows.length > 0) {
        return { success: false, errors: invalidRows.flatMap((r) => r.errors as string[]) };
      }

      validItems = validationResults
        .filter((r): r is { valid: true; data: FinalizeDonorOfferItem } => r.valid)
        .map((r) => r.data);
    }

    if (preview) {
      return { success: true, donorOfferId, createdCount: validItems.slice(0, 8).length };
    }

    await db.$transaction(async (tx) => {
      const donorOffer = await tx.donorOffer.update({
        where: { id: donorOfferId },
        data: donorOfferData,
        include: { items: true },
      });

      if (validItems.length > 0) {
        const itemsWithDonorOfferItemId = validItems.map((item) => ({
          ...item,
          donorName: donorOffer.donorName,
          donorOfferItemId: donorOffer.items.find(
            (di) =>
              item.title == di.title &&
              item.type === di.type &&
              (item.expirationDate as Date).getTime() === (di.expirationDate as Date).getTime() &&
              item.unitType === di.unitType &&
              item.quantityPerUnit == di.quantityPerUnit
          )?.id,
        }));

        await tx.item.createMany({ data: itemsWithDonorOfferItemId });
      }

      if (partnerIds.length > 0) {
        await tx.donorOfferPartnerVisibility.deleteMany({ where: { donorOfferId } });
        const partners = await tx.user.findMany({
          where: { id: { in: partnerIds }, type: UserType.PARTNER },
          select: { id: true },
        });
        if (partners.length !== partnerIds.length) {
          throw new ArgumentError("One or more partner IDs are invalid");
        }
        await tx.donorOfferPartnerVisibility.createMany({
          data: partnerIds.map((partnerId) => ({ donorOfferId, partnerId })),
        });
      }
    });

    return { success: true, donorOfferId, createdCount: validItems.length };
  }

  static async getDonorOfferForEdit(donorOfferId: number): Promise<DonorOfferEditDetails | null> {
    const donorOffer = await db.donorOffer.findUnique({
      where: { id: donorOfferId },
      include: {
        items: true,
        partnerVisibilities: {
          select: {
            partner: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!donorOffer) return null;

    return {
      id: donorOffer.id,
      offerName: donorOffer.offerName,
      donorName: donorOffer.donorName,
      partnerResponseDeadline: donorOffer.partnerResponseDeadline,
      donorResponseDeadline: donorOffer.donorResponseDeadline,
      items: donorOffer.items,
      partners: donorOffer.partnerVisibilities.map((pv) => ({
        id: pv.partner.id,
        name: pv.partner.name,
      })),
    };
  }

  static async updateDonorOfferFromForm(donorOfferId: number, formData: FormData) {
    console.log(formData);
    const offerName = formData.get("offerName") as string;
    const donorName = formData.get("donorName") as string;
    const partnerRequestDeadline = formData.get("partnerRequestDeadline") as string;
    const donorRequestDeadline = formData.get("donorRequestDeadline") as string;
    const partnerIds = formData.getAll("partnerIds") as string[];
    const items = (formData.getAll("items") as string[]).map((item) => JSON.parse(item));

    return await db.$transaction(async (tx) => {
      const updatedDonorOffer = await tx.donorOffer.update({
        where: { id: donorOfferId },
        data: {
          offerName,
          donorName,
          partnerResponseDeadline: new Date(partnerRequestDeadline),
          donorResponseDeadline: new Date(donorRequestDeadline),
          state: DonorOfferState.UNFINALIZED,
        },
      });

      await tx.donorOfferPartnerVisibility.deleteMany({
        where: { donorOfferId },
      });

      await tx.donorOfferPartnerVisibility.createMany({
        data: partnerIds.map((partnerId) => ({
          donorOfferId,
          partnerId: parseInt(partnerId),
        })),
      });

      for (const item of items) {
        if (item.id) {
          await tx.donorOfferItem.update({
            where: { id: item.id },
            data: {
              title: item.title,
              type: item.type,
              quantity: item.quantity,
              expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
              unitType: item.unitType,
              quantityPerUnit: item.quantityPerUnit,
            },
          });
        } else {
          await tx.donorOfferItem.create({
            data: {
              donorOfferId,
              title: item.title,
              type: item.type,
              quantity: item.quantity,
              expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
              unitType: item.unitType,
              quantityPerUnit: item.quantityPerUnit,
            },
          });
        }
      }

      return updatedDonorOffer;
    });
  }

  static async archiveDonorOffer(donorOfferId: number): Promise<void> {
    await db.donorOffer.update({
      where: { id: donorOfferId },
      data: { state: DonorOfferState.ARCHIVED },
    });
  }
}

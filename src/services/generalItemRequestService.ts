import { db } from "@/db";
import { NotFoundError, ArgumentError } from "@/util/errors";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { UpdateGeneralItemRequestData } from "@/types/api/generalItemRequest.types";
import { Prisma } from "@prisma/client";
import {
  GeneralItemRequestsResponse,
} from "@/types/api/donorOffer.types";
import { Filters } from "@/types/api/filter.types";
import { buildQueryWithPagination, buildWhereFromFilters } from "@/util/table";

export class GeneralItemRequestService {
  static async getById(id: number) {
    const request = await db.generalItemRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundError("Unallocated item request not found");
    }

    return request;
  }

  static async getRequestsByGeneralItemId(
    generalItemId: number,
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
      generalItemId,
      partner: {
        enabled: true,
        pending: false,
      },
    };

    const query = Prisma.validator<Prisma.GeneralItemRequestFindManyArgs>()({
      where,
      orderBy: { priority: "asc" },
      include: {
        generalItem: true,
        partner: {
          select: {
            name: true,
          },
        },
      },
    });

    buildQueryWithPagination(query, page, pageSize);

    const [requests, total] = await Promise.all([
      db.generalItemRequest.findMany(query),
      db.generalItemRequest.count({ where }),
    ]);

    type RequestWithRelations = Prisma.GeneralItemRequestGetPayload<typeof query>;

    return {
      requests: requests as RequestWithRelations[],
      total,
    };
  }

  static async createRequest(
    data: Omit<
      Prisma.GeneralItemRequestCreateInput,
      "generalItem" | "partner"
    > & { generalItemId: number; partnerId: number }
  ) {
    const partner = await db.user.findUnique({
      where: { id: data.partnerId },
      select: { enabled: true, pending: true, type: true },
    });

    if (!partner) {
      throw new NotFoundError("Partner not found");
    }

    if (!partner.enabled) {
      throw new ArgumentError("Cannot create request for deactivated partner");
    }

    if (partner.pending) {
      throw new ArgumentError("Cannot create request for pending partner");
    }
    
    const generalItem = await db.generalItem.findUnique({
      where: { id: data.generalItemId },
      include: {
        donorOffer: {
          select: { state: true, partnerResponseDeadline: true }
        },
        items: {
          where: {
            allocation: null
          },
          select: { id: true }
        }
      }
    });

    if (!generalItem) {
      throw new NotFoundError("General item not found");
    }

    if (generalItem.donorOffer?.state === "ARCHIVED") {
      if (generalItem.items.length === 0) {
        throw new ArgumentError("Cannot create requests for fully allocated archived items.");
      }
    }
    else if (generalItem.donorOffer?.state === "UNFINALIZED") {
      if (generalItem.donorOffer.partnerResponseDeadline) {
        const now = new Date();
        if (now > generalItem.donorOffer.partnerResponseDeadline) {
          throw new ArgumentError("Cannot create requests after the partner response deadline has passed.");
        }
      }
    }
    
    const newRequest = await db.generalItemRequest.create({
      data: {
        generalItem: {
          connect: { id: data.generalItemId as number },
        },
        partner: { connect: { id: data.partnerId as number } },
        quantity: data.quantity,
        comments: data.comments,
        priority: data.priority,
        finalQuantity: data.quantity,
      },
    });

    return newRequest;
  }

  static async updateRequest(id: number, data: Partial<UpdateGeneralItemRequestData>) {
    try {
      const request = await db.generalItemRequest.findUnique({
        where: { id },
        include: {
          generalItem: {
            include: {
              donorOffer: {
                select: { state: true, partnerResponseDeadline: true }
              },
              items: {
                where: {
                  allocation: null
                },
                select: { id: true }
              }
            }
          }
        }
      });

      if (!request) {
        throw new NotFoundError("Request not found");
      }

      if (request.generalItem?.donorOffer?.state === "ARCHIVED") {
        if (request.generalItem.items.length === 0) {
          throw new ArgumentError("Cannot update requests for fully allocated archived items.");
        }
      }
      else if (request.generalItem?.donorOffer?.state === "UNFINALIZED") {
        if (request.generalItem.donorOffer.partnerResponseDeadline) {
          const now = new Date();
          if (now > request.generalItem.donorOffer.partnerResponseDeadline) {
            throw new ArgumentError("Cannot update requests after the partner response deadline has passed.");
          }
        }
      }

      const updatedRequest = await db.generalItemRequest.update({
        where: { id },
        data
      });

      return updatedRequest;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("Unallocated item request not found");
        }
      }
      throw error;
    }
  }

  static async bulkUpdateRequests(
    updates: Array<{ requestId: number; finalQuantity: number }>
  ) {
    const requestIds = updates.map(u => u.requestId);
    const requests = await db.generalItemRequest.findMany({
      where: { id: { in: requestIds } },
      include: {
        generalItem: {
          include: {
            donorOffer: {
              select: { state: true, partnerResponseDeadline: true }
            },
            items: {
              where: {
                allocation: null
              },
              select: { id: true }
            }
          }
        }
      }
    });

    const fullyAllocatedArchivedRequests = requests.filter(
      r => r.generalItem?.donorOffer?.state === "ARCHIVED" && 
           r.generalItem.items.length === 0
    );

    if (fullyAllocatedArchivedRequests.length > 0) {
      throw new ArgumentError("Cannot update requests for fully allocated archived items.");
    }

    const now = new Date();
    const expiredUnfinalizedRequests = requests.filter(
      r => r.generalItem?.donorOffer?.state === "UNFINALIZED" &&
           r.generalItem.donorOffer.partnerResponseDeadline && 
           now > r.generalItem.donorOffer.partnerResponseDeadline
    );

    if (expiredUnfinalizedRequests.length > 0) {
      throw new ArgumentError("Cannot update requests after the partner response deadline has passed.");
    }

    const results = await db.$transaction(
      updates.map(({ requestId, finalQuantity }) =>
        db.generalItemRequest.update({
          where: { id: requestId },
          data: { finalQuantity },
        })
      )
    );

    return results;
  }

  static async reassignRequest(
    requestId: number,
    targetGeneralItemId: number
  ) {
    return db.$transaction(async (tx) => {
      const existingRequest = await tx.generalItemRequest.findUnique({
        where: { id: requestId },
        include: {
          partner: {
            select: { id: true, name: true },
          },
          generalItem: {
            select: {
              id: true,
              donorOfferId: true,
            },
          },
        },
      });

      if (!existingRequest || !existingRequest.generalItem) {
        throw new NotFoundError("Request not found");
      }

      const previousGeneralItemId = existingRequest.generalItem.id;

      const targetGeneralItem = await tx.generalItem.findUnique({
        where: { id: targetGeneralItemId },
        select: {
          id: true,
          donorOfferId: true,
          title: true,
        },
      });

      if (!targetGeneralItem) {
        throw new NotFoundError("Target general item not found");
      }

      if (
        targetGeneralItem.donorOfferId !==
        existingRequest.generalItem.donorOfferId
      ) {
        throw new ArgumentError(
          "Target general item must belong to the same donor offer."
        );
      }

      const targetLineItemCount = await tx.lineItem.count({
        where: { generalItemId: targetGeneralItemId },
      });

      if (targetLineItemCount === 0) {
        throw new ArgumentError(
          "Target general item does not have any available line items."
        );
      }

      const duplicateRequest = await tx.generalItemRequest.findFirst({
        where: {
          generalItemId: targetGeneralItemId,
          partnerId: existingRequest.partnerId,
        },
      });

      if (duplicateRequest) {
        throw new ArgumentError(
          "This partner already has a request for the selected general item."
        );
      }

      const updatedRequest = await tx.generalItemRequest.update({
        where: { id: requestId },
        data: { generalItemId: targetGeneralItemId },
      });

      let deletedGeneralItemId: number | null = null;
      const remainingRequestCount = await tx.generalItemRequest.count({
        where: { generalItemId: previousGeneralItemId },
      });

      if (remainingRequestCount === 0) {
        const remainingLineItems = await tx.lineItem.count({
          where: { generalItemId: previousGeneralItemId },
        });

        if (remainingLineItems === 0) {
          await tx.generalItem.delete({ where: { id: previousGeneralItemId } });
          deletedGeneralItemId = previousGeneralItemId;
        }
      }

      const allocated = await tx.lineItem.aggregate({
        where: {
          generalItemId: targetGeneralItemId,
          allocation: {
            partnerId: existingRequest.partnerId,
          },
        },
        _sum: {
          quantity: true,
        },
      });

      return {
        request: {
          id: updatedRequest.id,
          generalItemId: updatedRequest.generalItemId,
          partnerId: updatedRequest.partnerId,
          quantity: updatedRequest.quantity,
          finalQuantity: updatedRequest.finalQuantity,
          partner: existingRequest.partner,
          itemsAllocated: allocated._sum.quantity ?? 0,
        },
        targetGeneralItem: {
          id: targetGeneralItem.id,
          title: targetGeneralItem.title,
        },
        previousGeneralItemId,
        deletedGeneralItemId,
      };
    });
  }

  static async deleteRequest(id: number) {
    try {
      const request = await db.generalItemRequest.findUnique({
        where: { id },
        include: {
          generalItem: {
            include: {
              donorOffer: {
                select: { state: true, partnerResponseDeadline: true }
              },
              items: {
                where: {
                  allocation: null
                },
                select: { id: true }
              }
            }
          }
        }
      });

      if (!request) {
        throw new NotFoundError("Request not found");
      }

      if (request.generalItem?.donorOffer?.state === "ARCHIVED") {
        if (request.generalItem.items.length === 0) {
          throw new ArgumentError("Cannot delete requests for fully allocated archived items.");
        }
      }
      else if (request.generalItem?.donorOffer?.state === "UNFINALIZED") {
        if (request.generalItem.donorOffer.partnerResponseDeadline) {
          const now = new Date();
          if (now > request.generalItem.donorOffer.partnerResponseDeadline) {
            throw new ArgumentError("Cannot delete requests after the partner response deadline has passed.");
          }
        }
      }

      await db.generalItemRequest.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("Unallocated item request not found");
        }
      }
      throw error;
    }
  }

  static async getRequestsByPartnerId(
    partnerId: number,
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<GeneralItemRequestsResponse> {
    const partner = await db.user.findUnique({
      where: { id: partnerId },
      select: { enabled: true, pending: true },
    });

    if (!partner?.enabled || partner?.pending) {
      return { requests: [], total: 0 };
    }
    
    const filterWhere =
      buildWhereFromFilters<Prisma.GeneralItemRequestWhereInput>(
        Object.keys(Prisma.GeneralItemRequestScalarFieldEnum),
        filters
      );

    const where: Prisma.GeneralItemRequestWhereInput = {
      ...filterWhere,
      partnerId,
      generalItem: {
        donorOffer: {
          OR: [
            {
              archivedAt: null,
              state: "UNFINALIZED",
            },
            {
              archivedAt: { not: null },
              state: "ARCHIVED",
              items: {
                some: {
                  items: {
                    every: {
                      allocation: null
                    }
                  }
                }
              }
            }
          ]
        },
        
      },
    };

    const query = Prisma.validator<Prisma.GeneralItemRequestFindManyArgs>()({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        generalItem: {
          include: {
            donorOffer: {
              select: {
                id: true,
                offerName: true,
                donorName: true,
                state: true,
                archivedAt: true,
              },
            },
          },
        },
        partner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    buildQueryWithPagination(query, page, pageSize);

    const [requests, total] = await Promise.all([
      db.generalItemRequest.findMany(query),
      db.generalItemRequest.count({ where }),
    ]);

    type RequestWithRelations = Prisma.GeneralItemRequestGetPayload<typeof query>;

    return {
      requests: requests as RequestWithRelations[],
      total,
    };
  }
}

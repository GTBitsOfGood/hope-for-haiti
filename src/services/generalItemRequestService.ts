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
    // Check if the partner is enabled and not pending
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
    
    // Check if the general item belongs to an archived donor offer
    const generalItem = await db.generalItem.findUnique({
      where: { id: data.generalItemId },
      include: {
        donorOffer: {
          select: { state: true, partnerResponseDeadline: true }
        }
      }
    });

    if (generalItem?.donorOffer?.state === "ARCHIVED") {
      throw new ArgumentError("Cannot create requests for archived donor offers. Archived offers are read-only.");
    }

    // Check if the partner response deadline has passed
    if (generalItem?.donorOffer?.partnerResponseDeadline) {
      const now = new Date();
      if (now > generalItem.donorOffer.partnerResponseDeadline) {
        throw new ArgumentError("Cannot create requests after the partner response deadline has passed.");
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
      // Check if the request's general item belongs to an archived donor offer
      const request = await db.generalItemRequest.findUnique({
        where: { id },
        include: {
          generalItem: {
            include: {
              donorOffer: {
                select: { state: true, partnerResponseDeadline: true }
              }
            }
          }
        }
      });

      if (request?.generalItem?.donorOffer?.state === "ARCHIVED") {
        throw new ArgumentError("Cannot update requests for archived donor offers. Archived offers are read-only.");
      }

      // Check if the partner response deadline has passed
      if (request?.generalItem?.donorOffer?.partnerResponseDeadline) {
        const now = new Date();
        if (now > request.generalItem.donorOffer.partnerResponseDeadline) {
          throw new ArgumentError("Cannot update requests after the partner response deadline has passed.");
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
    // Check if any of the requests belong to archived donor offers
    const requestIds = updates.map(u => u.requestId);
    const requests = await db.generalItemRequest.findMany({
      where: { id: { in: requestIds } },
      include: {
        generalItem: {
          include: {
            donorOffer: {
              select: { state: true, partnerResponseDeadline: true }
            }
          }
        }
      }
    });

    const archivedRequests = requests.filter(
      r => r.generalItem?.donorOffer?.state === "ARCHIVED"
    );

    if (archivedRequests.length > 0) {
      throw new ArgumentError("Cannot update requests for archived donor offers. Archived offers are read-only.");
    }

    // Check if any requests have passed the partner response deadline
    const now = new Date();
    const expiredRequests = requests.filter(
      r => r.generalItem?.donorOffer?.partnerResponseDeadline && 
           now > r.generalItem.donorOffer.partnerResponseDeadline
    );

    if (expiredRequests.length > 0) {
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

  static async deleteRequest(id: number) {
    try {
      // Check if the request's general item belongs to an archived donor offer
      const request = await db.generalItemRequest.findUnique({
        where: { id },
        include: {
          generalItem: {
            include: {
              donorOffer: {
                select: { state: true, partnerResponseDeadline: true }
              }
            }
          }
        }
      });

      if (request?.generalItem?.donorOffer?.state === "ARCHIVED") {
        throw new ArgumentError("Cannot delete requests for archived donor offers. Archived offers are read-only.");
      }

      // Check if the partner response deadline has passed
      if (request?.generalItem?.donorOffer?.partnerResponseDeadline) {
        const now = new Date();
        if (now > request.generalItem.donorOffer.partnerResponseDeadline) {
          throw new ArgumentError("Cannot delete requests after the partner response deadline has passed.");
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
    // Check if the partner is enabled and not pending
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

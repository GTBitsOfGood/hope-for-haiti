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
    // Check if the partner is enabled
    const partner = await db.user.findUnique({
      where: { id: data.partnerId },
      select: { enabled: true, type: true },
    });
    
    if (!partner) {
      throw new NotFoundError("Partner not found");
    }
    
    if (!partner.enabled) {
      throw new ArgumentError("Cannot create request for deactivated partner");
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
    // Check if the partner is enabled
    const partner = await db.user.findUnique({
      where: { id: partnerId },
      select: { enabled: true },
    });
    
    if (!partner?.enabled) {
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

import { db } from "@/db";
import {
  CreateGeneralItemParams,
  UpdateGeneralItemParams,
} from "@/types/api/generalItem.types";
import { NotFoundError } from "@/util/errors";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Filters } from "@/types/api/filter.types";
import { $Enums, Prisma } from "@prisma/client";
import { buildQueryWithPagination, buildWhereFromFilters } from "@/util/table";
import { GeneralItemWithRelations } from "@/types/api/generalItem.types";

export class GeneralItemService {
  static async createGeneralItem(item: CreateGeneralItemParams) {
    return await db.generalItem.create({
      data: item,
    });
  }

  static async updateGeneralItem(id: number, updates: UpdateGeneralItemParams) {
    try {
      return await db.generalItem.update({
        where: { id },
        data: updates,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("General item not found");
        }
      }
      throw error;
    }
  }

  static async deleteGeneralItem(id: number) {
    try {
      return await db.generalItem.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("General item not found");
        }
      }
      throw error;
    }
  }

  static async getUnallocatedItems(
    filters?: Filters,
    page?: number,
    pageSize?: number
  ) {

    const filterWhere = buildWhereFromFilters<Prisma.GeneralItemWhereInput>(
      Object.keys(Prisma.GeneralItemScalarFieldEnum),
      filters
    );

    const query: Prisma.GeneralItemFindManyArgs = {
      where: {
        ...filterWhere,
        donorOffer: {
          state: "ARCHIVED",
        },
        items: {
          some: {
            allocation: null,
          }
        }
      },
      include: {
        items: {
          where: {
            allocation: null,
          }
        },
        requests: {
          include: {
            partner: {
              select: { id: true, name: true },
            },
          },
        },
        donorOffer: true,
      },
      orderBy: {
        id: "asc",
      },
      take: pageSize,
      skip: (page && pageSize) ? (page - 1) * pageSize : undefined,
    };

    buildQueryWithPagination(query, page, pageSize);

    const [generalItems, total] = await Promise.all([
      db.generalItem.findMany(query) as Promise<GeneralItemWithRelations[]>,
      db.generalItem.count({ where: {
        ...filterWhere,
        donorOffer: {
          state: $Enums.DonorOfferState.ARCHIVED,
        },
        items: {
          some: {
            allocation: null,
          }
        }
      }, }),
    ]);

    const itemsWithFilteredRequests = generalItems.map((item) => {
      const archivedAt = item.donorOffer.archivedAt;

      const filteredRequests = archivedAt
        ? item.requests.filter((request) => request.createdAt >= archivedAt)
        : item.requests;

      return {
        ...item,
        requests: filteredRequests,
      };
    });

    return {
      items: itemsWithFilteredRequests,
      total: total,
    };
  }

  static async getExpiringItems(cutoff: Date) {
    const generalItems = await db.generalItem.findMany({
      where: {
        expirationDate: {
          not: null,
          lte: cutoff,
        },
        donorOffer: {
          state: {
            not: $Enums.DonorOfferState.ARCHIVED,
          },
        },
      },
      include: {
        donorOffer: true,
        items: {
          select: {
            quantity: true,
            allocation: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: {
        expirationDate: "asc",
      },
    });

    return generalItems.map((item) => {
      const { allocatedQuantity, unallocatedQuantity } = item.items.reduce(
        (totals, lineItem) => {
          if (lineItem.allocation) {
            totals.allocatedQuantity += lineItem.quantity;
          } else {
            totals.unallocatedQuantity += lineItem.quantity;
          }
          return totals;
        },
        { allocatedQuantity: 0, unallocatedQuantity: 0 }
      );

      return {
        item,
        unallocatedQuantity,
        allocatedQuantity,
      } 
    });
  }

  static async getAvailableItemsForPartner(
    partnerId: number,
    filters?: Filters,
    page?: number,
    pageSize?: number) 
  {
    const filterWhere = buildWhereFromFilters<Prisma.GeneralItemWhereInput>(
      Object.keys(Prisma.GeneralItemScalarFieldEnum),
      filters
    );

    const where: Prisma.GeneralItemWhereInput = {
      ...filterWhere,
      OR: [
        {
          donorOffer: {
            state: $Enums.DonorOfferState.UNFINALIZED,
            partnerVisibilities: {
              some: {
                id: partnerId,
              },
            },
          },
        },
        {
          donorOffer: {
            state: $Enums.DonorOfferState.ARCHIVED,
            partnerVisibilities: {
              some: {
                id: partnerId,
              },
            },
          },
          items: {
            some: {
              allocation: null,
            },
          },
        },
      ],
      requests: {
        none: {
          partnerId: partnerId,
        },
      },
    };

    const query: Prisma.GeneralItemFindManyArgs = {
      where,
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
        items: {
          where: {
            allocation: null,
          },
          select: {
            id: true,
            quantity: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    };

    buildQueryWithPagination(query, page, pageSize);

    type GeneralItemWithRelations = Prisma.GeneralItemGetPayload<{
      include: {
        donorOffer: {
          select: {
            id: true;
            offerName: true;
            donorName: true;
            state: true;
            archivedAt: true;
          };
        };
        items: {
          where: {
            allocation: null;
          };
          select: {
            id: true;
            quantity: true;
          };
        };
      };
    }>;

    const [generalItems, total] = await Promise.all([
      db.generalItem.findMany(query) as Promise<GeneralItemWithRelations[]>,
      db.generalItem.count({ where }),
    ]);

    const itemsWithQuantity = generalItems.map((item) => {
      let availableQuantity = item.initialQuantity;

      if (item.donorOffer.state === $Enums.DonorOfferState.ARCHIVED) {
        availableQuantity = item.items.reduce((sum: number, lineItem) => sum + lineItem.quantity, 0);
      }

      return {
        ...item,
        availableQuantity,
      };
    });

    return {
      items: itemsWithQuantity,
      total,
    };
  }

}

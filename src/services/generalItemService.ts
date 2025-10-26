import { db } from "@/db";
import {
  CreateGeneralItemParams,
  UpdateGeneralItemParams,
} from "@/types/api/generalItem.types";
import { NotFoundError } from "@/util/errors";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Filters, FilterValue } from "@/types/api/filter.types";
import { $Enums, GeneralItem, Prisma } from "@prisma/client";
import { buildQueryWithPagination, buildWhereFromFilters } from "@/util/table";

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
      db.generalItem.findMany(query),
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

    return {
      items: generalItems,
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

  private static matchesFilters(
    item: GeneralItem & { quantity: number },
    filters: Filters
  ) {
    return Object.entries(filters).every(([field, filter]) => {
      if (!filter) {
        return true;
      }

      const value = (item as Record<string, unknown>)[field];
      return this.matchesFilterValue(value, filter);
    });
  }

  private static matchesFilterValue(
    value: unknown,
    filter: FilterValue
  ): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    switch (filter.type) {
      case "string":
        return String(value).toLowerCase().includes(filter.value.toLowerCase());
      case "enum":
        return filter.values.includes(String(value));
      case "number": {
        const num = Number(value);
        if (Number.isNaN(num)) {
          return false;
        }
        if (filter.lte !== undefined) {
          return num >= filter.gte && num <= filter.lte;
        }
        return num >= filter.gte;
      }
      case "date": {
        const dateValue = new Date(value as string).getTime();
        const gte = new Date(filter.gte).getTime();
        const lte = filter.lte ? new Date(filter.lte).getTime() : undefined;
        if (Number.isNaN(dateValue)) {
          return false;
        }
        if (lte !== undefined) {
          return dateValue >= gte && dateValue <= lte;
        }
        return dateValue >= gte;
      }
      default:
        return false;
    }
  }
}

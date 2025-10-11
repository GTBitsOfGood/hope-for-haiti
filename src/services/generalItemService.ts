import { db } from "@/db";
import {
  CreateGeneralItemParams,
  UpdateGeneralItemParams,
} from "@/types/api/generalItem.types";
import { NotFoundError } from "@/util/errors";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Filters, FilterValue } from "@/types/api/filter.types";
import { GeneralItem } from "@prisma/client";

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
    const generalItems = await db.generalItem.findMany({
      include: {
        items: {
          where: { allocationId: null },
        },
        requests: {
          include: {
            partner: {
              select: { name: true },
            },
          },
        },
        donorOffer: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    const unallocatedWithLineItems = generalItems
      .map((item) => {
        const allocatedQuantity = item.items.reduce(
          (sum, lineItem) =>
            sum + (lineItem.allocationId !== null ? lineItem.quantity : 0),
          0
        );
        const quantity = item.initialQuantity - allocatedQuantity;
        return {
          item,
          quantity,
        };
      })
      .filter(({ quantity }) => quantity > 0);

    const filtered = filters
      ? unallocatedWithLineItems.filter(({ item, quantity }) =>
          this.matchesFilters({ ...item, quantity }, filters)
        )
      : unallocatedWithLineItems;

    const total = filtered.length;

    const paginated =
      page && pageSize
        ? filtered.slice(
            (page - 1) * pageSize,
            (page - 1) * pageSize + pageSize
          )
        : filtered;

    const sanitize = paginated.map(({ item, quantity }) => {
      return {
        ...item,
        quantity,
      };
    });

    const unitTypes = Array.from(
      new Set(unallocatedWithLineItems.map(({ item }) => item.unitType))
    ).sort();

    const donorNames = Array.from(
      new Set(
        unallocatedWithLineItems.map(({ item }) => item.donorOffer?.donorName)
      )
    )
      .filter((name): name is string => Boolean(name))
      .sort();

    const itemTypes = Array.from(
      new Set(unallocatedWithLineItems.map(({ item }) => item.type))
    ).sort();

    return {
      items: sanitize,
      unitTypes,
      donorNames,
      itemTypes,
      total,
    };
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

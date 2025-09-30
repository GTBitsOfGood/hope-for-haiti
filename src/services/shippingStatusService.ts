import { db } from "@/db";
import { Item, Prisma, ShippingStatus } from "@prisma/client";
import {
  ShippingStatusWithItems,
  UpdateShippingStatusData,
} from "@/types/api/shippingStatus.types";
import { Filters, FilterValue } from "@/types/api/filter.types";
import { buildWhereFromFilters } from "@/util/table";

export class ShippingStatusService {
  static async getShippingStatuses(
    filters?: Filters,
    page?: number,
    pageSize?: number,
  ): Promise<ShippingStatusWithItems> {
    const { itemFilters, statusFilters } = this.splitShippingFilters(filters);

    const itemWhereFilters = buildWhereFromFilters<Prisma.ItemWhereInput>(
      Object.keys(Prisma.ItemScalarFieldEnum),
      itemFilters,
    );

    const clauses: Prisma.ItemWhereInput[] = [
      {
        donorShippingNumber: { not: null },
        hfhShippingNumber: { not: null },
      },
    ];

    if (Object.keys(itemWhereFilters).length > 0) {
      clauses.push(itemWhereFilters);
    }

    return this.buildShippingStatusResponse(clauses, statusFilters, page, pageSize);
  }

  static async getPartnerShippingStatuses(
    partnerId: number,
    filters?: Filters,
    page?: number,
    pageSize?: number,
  ): Promise<ShippingStatusWithItems> {
    const { itemFilters, statusFilters } = this.splitShippingFilters(filters);

    const itemWhereFilters = buildWhereFromFilters<Prisma.ItemWhereInput>(
      Object.keys(Prisma.ItemScalarFieldEnum),
      itemFilters,
    );

    const clauses: Prisma.ItemWhereInput[] = [
      {
        donorShippingNumber: { not: null },
        hfhShippingNumber: { not: null },
      },
      {
        OR: [
          {
            unallocatedItemRequestAllocations: {
              some: {
                partnerId,
              },
            },
          },
          {
            unallocatedItemRequestAllocations: {
              some: {
                unallocatedItemRequest: {
                  partnerId,
                },
              },
            },
          },
          {
            donorOfferItemRequestAllocations: {
              some: {
                donorOfferItemRequest: {
                  partnerId,
                },
              },
            },
          },
        ],
      },
    ];

    if (Object.keys(itemWhereFilters).length > 0) {
      clauses.push(itemWhereFilters);
    }

    return this.buildShippingStatusResponse(clauses, statusFilters, page, pageSize);
  }

  private static splitShippingFilters(filters?: Filters): {
    itemFilters?: Filters;
    statusFilters?: Filters;
  } {
    if (!filters) {
      return {};
    }

    const itemFieldKeys = new Set(Object.keys(Prisma.ItemScalarFieldEnum));
    const itemFilters: Filters = {};
    const statusFilters: Filters = {};

    for (const [key, value] of Object.entries(filters)) {
      if (!value) {
        continue;
      }

      if (itemFieldKeys.has(key)) {
        itemFilters[key] = value;
      } else {
        statusFilters[key] = value;
      }
    }

    return {
      itemFilters: Object.keys(itemFilters).length ? itemFilters : undefined,
      statusFilters: Object.keys(statusFilters).length ? statusFilters : undefined,
    };
  }

  private static matchesFilterValue(value: unknown, filter: FilterValue): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    switch (filter.type) {
      case "string": {
        if (typeof value !== "string") return false;
        return value.toLowerCase().includes(filter.value.toLowerCase());
      }
      case "enum": {
        if (typeof value !== "string") return false;
        return filter.values.includes(value);
      }
      case "number": {
        if (typeof value !== "number") return false;
        if (value < filter.gte) return false;
        if (filter.lte !== undefined && value > filter.lte) return false;
        return true;
      }
      case "date": {
        const date = value instanceof Date ? value : new Date(value);
        if (isNaN(date.getTime())) return false;
        const gteDate = new Date(filter.gte);
        if (date < gteDate) return false;
        if (filter.lte) {
          const lteDate = new Date(filter.lte);
          if (date > lteDate) return false;
        }
        return true;
      }
      default:
        return false;
    }
  }

  private static async buildShippingStatusResponse(
    clauses: Prisma.ItemWhereInput[],
    statusFilters?: Filters,
    page?: number,
    pageSize?: number,
  ): Promise<ShippingStatusWithItems> {
    const where: Prisma.ItemWhereInput = clauses.length > 1 ? { AND: clauses } : clauses[0];

    const shippingNumberPairs = await db.item.findMany({
      where,
      distinct: ["donorShippingNumber", "hfhShippingNumber"],
      select: {
        donorShippingNumber: true,
        hfhShippingNumber: true,
      },
    });

    const validPairs = shippingNumberPairs.filter(
      (pair): pair is { donorShippingNumber: string; hfhShippingNumber: string } =>
        Boolean(pair.donorShippingNumber && pair.hfhShippingNumber),
    );

    if (validPairs.length === 0) {
      return { shippingStatuses: [], items: [], total: 0 };
    }

    const statusRecords = await db.shippingStatus.findMany({
      where: {
        OR: validPairs.map((pair) => ({
          donorShippingNumber: pair.donorShippingNumber,
          hfhShippingNumber: pair.hfhShippingNumber,
        })),
      },
    });

    const statusMap = new Map<string, ShippingStatus>();
    statusRecords.forEach((status) => {
      const key = `${status.donorShippingNumber}|${status.hfhShippingNumber}`;
      statusMap.set(key, status);
    });

    const pairsWithStatuses = validPairs.map((pair) => {
      const key = `${pair.donorShippingNumber}|${pair.hfhShippingNumber}`;
      const status = statusMap.get(key);

      if (status) {
        return { pair, status };
      }

      const defaultStatus: ShippingStatus = {
        id: 0,
        donorShippingNumber: pair.donorShippingNumber,
        hfhShippingNumber: pair.hfhShippingNumber,
        value: "WAITING_ARRIVAL_FROM_DONOR",
      };

      return { pair, status: defaultStatus };
    });

    const filteredPairs = statusFilters
      ? pairsWithStatuses.filter(({ status }) =>
          Object.entries(statusFilters).every(([field, filter]) =>
            this.matchesFilterValue((status as Record<string, unknown>)[field], filter),
          ),
        )
      : pairsWithStatuses;

    const total = filteredPairs.length;

    let offset = 0;
    let paginatedPairs = filteredPairs;
    if (page && pageSize) {
      offset = (page - 1) * pageSize;
      paginatedPairs = filteredPairs.slice(offset, offset + pageSize);
    }

    const items: Item[][] = [];
    const shippingStatuses: ShippingStatus[] = [];

    await Promise.all(
      paginatedPairs.map(async ({ pair, status }, index) => {
        const lineItems = await db.item.findMany({
          where: {
            donorShippingNumber: pair.donorShippingNumber,
            hfhShippingNumber: pair.hfhShippingNumber,
          },
        });

        items[index] = lineItems;
        shippingStatuses[index] = {
          ...status,
          id: offset + index,
        };
      }),
    );

    return {
      shippingStatuses,
      items,
      total,
    };
  }

  static async updateShippingStatus(data: UpdateShippingStatusData) {
    await db.shippingStatus.upsert({
      where: {
        donorShippingNumber_hfhShippingNumber: {
          donorShippingNumber: data.donorShippingNumber,
          hfhShippingNumber: data.hfhShippingNumber,
        },
      },
      update: {
        value: data.value,
      },
      create: {
        donorShippingNumber: data.donorShippingNumber,
        hfhShippingNumber: data.hfhShippingNumber,
        value: data.value,
      },
    });
  }
}

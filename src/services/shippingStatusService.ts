import { db } from "@/db";
import { LineItem, Prisma, ShippingStatus } from "@prisma/client";
import {
  ShippingStatusWithItems,
  UpdateShippingStatusData,
} from "@/types/api/shippingStatus.types";
import { Filters, FilterValue } from "@/types/api/filter.types";
import { buildWhereFromFilters } from "@/util/table";

export class ShippingStatusService {
  static async getShipments(
    page?: number,
    pageSize?: number,
    filters?: Filters
  ) {
    const where = buildWhereFromFilters<Prisma.ShippingStatusWhereInput>(
      Object.keys(Prisma.ShippingStatusScalarFieldEnum),
      filters
    );

    const statuses = await db.shippingStatus.findMany({
      where,
      skip: page && pageSize ? (page - 1) * pageSize : undefined,
      take: pageSize,
    });

    // const lineItems = await db.$queryRaw`
    //   SELECT *
    //   FROM "LineItem"

    //   JOIN "Allocation" ON "LineItem".id = "Allocation"."lineItemId"
    //   JOIN "User" ON "Allocation"."partnerId" = "User".id
    //   JOIN "GeneralItem" ON "LineItem"."generalItemId" = "GeneralItem".id

    //   WHERE "donorShippingNumber" IN (${Prisma.join(statuses.map((s) => s.donorShippingNumber))})
    //      OR "hfhShippingNumber" IN (${Prisma.join(statuses.map((s) => s.hfhShippingNumber))})

    //   GROUP BY "User".id, "GeneralItem".id
    // `;

    // console.log(statuses);
    // console.log(lineItems);

    return statuses;
  }

  static async getShippingStatuses(
    page?: number,
    pageSize?: number,
    filters?: Filters
  ): Promise<ShippingStatusWithItems> {
    const { lineItemFilters, statusFilters } =
      this.splitShippingFilters(filters);

    const lineItemWhereFilters =
      buildWhereFromFilters<Prisma.LineItemWhereInput>(
        Object.keys(Prisma.LineItemScalarFieldEnum),
        lineItemFilters
      );

    const clauses: Prisma.LineItemWhereInput[] = [
      {
        donorShippingNumber: { not: null },
        hfhShippingNumber: { not: null },
      },
    ];

    if (Object.keys(lineItemWhereFilters).length > 0) {
      clauses.push(lineItemWhereFilters);
    }

    return this.buildShippingStatusResponse(
      clauses,
      statusFilters,
      page,
      pageSize
    );
  }

  static async getPartnerShippingStatuses(
    partnerId: number,
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<ShippingStatusWithItems> {
    const { lineItemFilters, statusFilters } =
      this.splitShippingFilters(filters);

    const lineItemWhereFilters =
      buildWhereFromFilters<Prisma.LineItemWhereInput>(
        Object.keys(Prisma.LineItemScalarFieldEnum),
        lineItemFilters
      );

    const clauses: Prisma.LineItemWhereInput[] = [
      {
        donorShippingNumber: { not: null },
        hfhShippingNumber: { not: null },
      },
      {
        allocation: {
          partnerId,
        },
      },
    ];

    if (Object.keys(lineItemWhereFilters).length > 0) {
      clauses.push(lineItemWhereFilters);
    }

    return this.buildShippingStatusResponse(
      clauses,
      statusFilters,
      page,
      pageSize
    );
  }

  private static splitShippingFilters(filters?: Filters): {
    lineItemFilters?: Filters;
    statusFilters?: Filters;
  } {
    if (!filters) {
      return {};
    }

    const lineItemFieldKeys = new Set(
      Object.keys(Prisma.LineItemScalarFieldEnum)
    );
    const statusFieldKeys = new Set(
      Object.keys(Prisma.ShippingStatusScalarFieldEnum)
    );

    const lineItemFilters: Filters = {};
    const statusFilters: Filters = {};

    for (const [key, value] of Object.entries(filters)) {
      if (!value) {
        continue;
      }

      if (lineItemFieldKeys.has(key)) {
        lineItemFilters[key] = value;
      } else if (statusFieldKeys.has(key)) {
        statusFilters[key] = value;
      }
    }

    return {
      lineItemFilters: Object.keys(lineItemFilters).length
        ? lineItemFilters
        : undefined,
      statusFilters: Object.keys(statusFilters).length
        ? statusFilters
        : undefined,
    };
  }

  private static matchesFilterValue(
    value: unknown,
    filter: FilterValue
  ): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    switch (filter.type) {
      case "string": {
        return String(value).toLowerCase().includes(filter.value.toLowerCase());
      }
      case "enum": {
        return filter.values.includes(String(value));
      }
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
        if (lte) {
          return dateValue >= gte && dateValue <= lte;
        }
        return dateValue >= gte;
      }
      default:
        return false;
    }
  }

  private static async buildShippingStatusResponse(
    clauses: Prisma.LineItemWhereInput[],
    statusFilters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<ShippingStatusWithItems> {
    const where: Prisma.LineItemWhereInput =
      clauses.length > 1 ? { AND: clauses } : clauses[0];

    const shippingNumberPairs = await db.lineItem.findMany({
      where,
      distinct: ["donorShippingNumber", "hfhShippingNumber"],
      select: {
        donorShippingNumber: true,
        hfhShippingNumber: true,
      },
    });

    const validPairs = shippingNumberPairs.filter(
      (
        pair
      ): pair is { donorShippingNumber: string; hfhShippingNumber: string } =>
        Boolean(pair.donorShippingNumber && pair.hfhShippingNumber)
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
            this.matchesFilterValue(
              (status as Record<string, unknown>)[field],
              filter as FilterValue
            )
          )
        )
      : pairsWithStatuses;

    const total = filteredPairs.length;

    let offset = 0;
    let paginatedPairs = filteredPairs;
    if (page && pageSize) {
      offset = (page - 1) * pageSize;
      paginatedPairs = filteredPairs.slice(offset, offset + pageSize);
    }

    const items: LineItem[][] = [];
    const shippingStatuses: ShippingStatus[] = [];

    await Promise.all(
      paginatedPairs.map(async ({ pair, status }, index) => {
        const lineItems = await db.lineItem.findMany({
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
      })
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

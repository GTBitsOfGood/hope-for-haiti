import type { Filters, FilterValue } from "@/types/api/filter.types";
import { Prisma } from "@prisma/client";

export type FilterFieldHandler<TWhere> = (
  where: TWhere,
  filter: FilterValue
) => void;

export type FilterFieldHandlers<TWhere> = Record<
  string,
  FilterFieldHandler<TWhere>
>;

export function buildWhereFromFilters<TWhere extends Record<string, unknown>>(
  keys: string[],
  filters?: Filters
) {
  const where: TWhere = {} as TWhere;

  if (!filters) {
    return where;
  }

  for (const key of keys) {
    const filter = filters[key];

    if (!filter) {
      continue;
    }

    let condition;
    switch (filter.type) {
      case "string": {
        condition = {
          contains: filter.value,
          mode: "insensitive",
        };
        break;
      }
      case "enum": {
        condition = {
          in: filter.values,
        };
        break;
      }
      case "number": {
        const numberCondition: { gte: number; lte?: number } = {
          gte: filter.gte,
        };
        if (filter.lte !== undefined) {
          numberCondition.lte = filter.lte;
        }
        condition = numberCondition;
        break;
      }
      case "date": {
        const dateCondition: { gte: string; lte?: string } = {
          gte: filter.gte,
        };
        if (filter.lte !== undefined) {
          dateCondition.lte = filter.lte;
        }
        condition = dateCondition;
        break;
      }
    }

    (where as Record<string, unknown>)[key] = condition;
  }

  return where;
}

export function buildWhereFromFiltersSql(
  keys: string[],
  filters?: Filters
): Prisma.Sql | undefined {
  if (!filters || Object.keys(filters).length === 0) {
    return;
  }

  const conditions: Prisma.Sql[] = [];

  for (const key of keys) {
    const filter = filters[key];

    if (!filter) {
      continue;
    }

    switch (filter.type) {
      case "string": {
        conditions.push(
          Prisma.sql`${Prisma.raw(key)} ILIKE ${"%" + filter.value + "%"}`
        );
        break;
      }
      case "enum": {
        conditions.push(
          Prisma.sql`${Prisma.raw(key)} IN (${Prisma.join(filter.values)})`
        );
        break;
      }
      case "number": {
        let left: Prisma.Sql | undefined = undefined;
        let right: Prisma.Sql | undefined = undefined;
        if (filter.lte !== undefined) {
          left = Prisma.sql`${Prisma.raw(key)} <= ${filter.lte}`;
        } else {
          right = Prisma.sql`${Prisma.raw(key)} >= ${filter.gte}`;
        }
        conditions.push(
          left && right ? Prisma.sql`${left} AND ${right}` : (left ?? right)!
        );
        break;
      }
      case "date": {
        let left: Prisma.Sql | undefined = undefined;
        let right: Prisma.Sql | undefined = undefined;
        if (filter.lte !== undefined) {
          left = Prisma.sql`${Prisma.raw(key)} <= ${filter.lte}`;
        } else {
          right = Prisma.sql`${Prisma.raw(key)} >= ${filter.gte}`;
        }
        conditions.push(
          left && right ? Prisma.sql`${left} AND ${right}` : (left ?? right)!
        );
        break;
      }
    }
  }

  if (conditions.length === 0) {
    return;
  } 

  return Prisma.sql`${Prisma.join(conditions, " AND ")}`;
}

export function buildQueryWithPagination<Query extends Record<string, unknown>>(
  query: Query,
  page?: number,
  pageSize?: number
) {
  if (!page || !pageSize) {
    return query;
  }

  (query as Record<string, unknown>)["take"] = pageSize;
  (query as Record<string, unknown>)["skip"] = (page - 1) * pageSize;
}

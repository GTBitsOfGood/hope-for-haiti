import { db } from "@/db";
import { NotFoundError } from "@/util/errors";
import { Prisma, UserType } from "@prisma/client";
import { isEqual } from "date-fns";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import {
  GetUnallocatedItemsParams,
  CreateUnallocatedItemRequestData,
  GetLineItemsParams,
  GetUnallocatedItemRequestsParams,
  UnallocatedItem,
  CreateMultipleUnallocatedItemRequestsData
} from "@/types/api/unallocatedItem.types";
import { Filters } from "@/types/api/filter.types";
import { buildQueryWithPagination, buildWhereFromFilters } from "@/util/table";

export class UnallocatedItemService {
  static async getUnallocatedItems(
    params: GetUnallocatedItemsParams,
    filters?: Filters,
    page?: number,
    pageSize?: number,
  ) {
    const scopeVisibility =
      params.userType === UserType.PARTNER ? { visible: true } : {};

    const uniqueUnallocatedItemRequest = await db.unallocatedItemRequest.findMany({
      distinct: [
        "title",
        "type",
        "expirationDate",
        "unitType",
        "quantityPerUnit",
      ],
      select: {
        title: true,
        type: true,
        expirationDate: true,
        unitType: true,
        quantityPerUnit: true,
      },
      where: {
        partnerId: parseInt(params.userId),
      },
    });

    const itemFilters = buildWhereFromFilters<Prisma.ItemWhereInput>(
      Object.keys(Prisma.ItemScalarFieldEnum),
      filters,
    );

    const expirationFilter = params.expirationDateAfter && !params.expirationDateBefore
      ? {
          OR: [
            { expirationDate: { gt: params.expirationDateAfter } },
            { expirationDate: null },
          ],
        }
      : {
          expirationDate: {
            ...(params.expirationDateAfter && { gt: params.expirationDateAfter }),
            ...(params.expirationDateBefore && { lt: params.expirationDateBefore }),
          },
        };

    const where: Prisma.ItemWhereInput = {
      ...scopeVisibility,
      ...itemFilters,
      ...expirationFilter,
    };

    const groupByFields: (keyof Prisma.ItemGroupByOutputType)[] = [
      "title",
      "type",
      "expirationDate",
      "unitType",
      "quantityPerUnit",
    ];

    const query: Prisma.ItemGroupByArgs = {
      by: groupByFields as string[],
      _sum: {
        quantity: true,
      },
      where,
    };

    buildQueryWithPagination(query as unknown as Record<string, unknown>, page, pageSize);

    const [groupedItems, totalGroups] = await Promise.all([
      db.item.groupBy(query),
      db.item.groupBy({
        by: groupByFields as string[],
        _sum: { quantity: true },
        where,
      }),
    ]);

    const tableItems = groupedItems.map((item) => {
      const requestedItem = uniqueUnallocatedItemRequest.find(
        (unallocatedItem) => {
          return (
            item.title === unallocatedItem.title &&
            item.type === unallocatedItem.type &&
            isEqual(
              item.expirationDate ?? "",
              unallocatedItem.expirationDate ?? ""
            ) &&
            item.unitType === unallocatedItem.unitType &&
            item.quantityPerUnit === unallocatedItem.quantityPerUnit
          );
        }
      );
      const copy = {
        ...item,
        requested: requestedItem !== undefined,
        quantity: item._sum.quantity,
        expirationDate: item.expirationDate?.toISOString(),
        _sum: undefined,
      };
      delete copy._sum;
      return copy;
      });

      const donorNames = await db.item.findMany({
        distinct: "donorName",
        select: {
        donorName: true,
      },
      orderBy: {
        donorName: "asc",
      },
    });

    const unitTypes = await db.item.findMany({
      distinct: "unitType",
      select: {
        unitType: true,
      },
      orderBy: {
        unitType: "asc",
      },
    });

    const itemTypes = await db.item.findMany({
      distinct: "type",
      select: {
        type: true,
      },
      orderBy: {
        type: "asc",
      },
    });

    return {
      items: tableItems,
      unitTypes: unitTypes.map((item) => item.unitType),
      donorNames: donorNames.map((item) => item.donorName),
      itemTypes: itemTypes.map((item) => item.type),
      total: totalGroups.length,
    };
  }

  static async createUnallocatedItemRequest(data: CreateUnallocatedItemRequestData) {
    const request = await db.unallocatedItemRequest.create({
      data: {
        title: data.title,
        type: data.type,
        priority: data.priority,
        expirationDate: data.expirationDate,
        unitType: data.unitType,
        quantityPerUnit: data.quantityPerUnit,
        quantity: data.quantity,
        comments: data.comments,
        partnerId: data.partnerId,
      },
    });

    return request;
  }

  static async createMultipleUnallocatedItemRequests(data: CreateMultipleUnallocatedItemRequestsData) {
    const requestsData = data.requests.map((req) => ({
      partnerId: data.partnerId,
      title: req.generalItem.title,
      type: req.generalItem.type,
      expirationDate: req.generalItem.expirationDate
        ? new Date(req.generalItem.expirationDate)
        : null,
      quantityPerUnit: req.generalItem.quantityPerUnit,
      unitType: req.generalItem.unitType,
      priority: req.priority,
      quantity: parseInt(req.quantity),
      comments: req.comments,
    }));

    await db.unallocatedItemRequest.createMany({
      data: requestsData,
    });
  }

  static async getPartnerUnallocatedItemRequests(
    partnerId: number,
    filters?: Filters,
    page?: number,
    pageSize?: number,
  ) {
    const filterWhere = buildWhereFromFilters<Prisma.UnallocatedItemRequestWhereInput>(
      Object.keys(Prisma.UnallocatedItemRequestScalarFieldEnum),
      filters,
    );

    const where: Prisma.UnallocatedItemRequestWhereInput = {
      ...filterWhere,
      partnerId,
    };

    const query: Prisma.UnallocatedItemRequestFindManyArgs = {
      where,
      select: {
        id: true,
        title: true,
        expirationDate: true,
        unitType: true,
        quantityPerUnit: true,
        priority: true,
        quantity: true,
        createdAt: true,
        comments: true,
      },
      orderBy: {
        id: "asc",
      },
    };

    buildQueryWithPagination(query, page, pageSize);

    const [requests, total] = await Promise.all([
      db.unallocatedItemRequest.findMany(query),
      db.unallocatedItemRequest.count({ where }),
    ]);

    const mappedRequests = requests.map((req) => ({
      ...req,
      expirationDate: req.expirationDate?.toLocaleDateString(),
      createdAt: req.createdAt.toLocaleDateString(),
    }));

    return { requests: mappedRequests, total };
  }

  static async getLineItems(
    params: GetLineItemsParams,
    filters?: Filters,
    page?: number,
    pageSize?: number,
  ) {
    const filterWhere = buildWhereFromFilters<Prisma.ItemWhereInput>(
      Object.keys(Prisma.ItemScalarFieldEnum),
      filters,
    );

    const where: Prisma.ItemWhereInput = {
      ...filterWhere,
      title: params.title,
      type: params.type,
      expirationDate: params.expirationDate,
      unitType: params.unitType,
      quantityPerUnit: params.quantityPerUnit,
    };

    const query: Prisma.ItemFindManyArgs = {
      where,
    };

    buildQueryWithPagination(query, page, pageSize);

    const [items, total] = await Promise.all([
      db.item.findMany(query),
      db.item.count({ where }),
    ]);

    return { items, total };
  }

  static async deleteItem(itemId: number) {
    try {
      await db.item.delete({ where: { id: itemId } });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("Item not found");
        }
      }
      throw error;
    }
  }

  static async getUnallocatedItemRequests(
    params: GetUnallocatedItemRequestsParams,
    filters?: Filters,
    page?: number,
    pageSize?: number,
  ) {
    const filterWhere = buildWhereFromFilters<Prisma.UnallocatedItemRequestWhereInput>(
      Object.keys(Prisma.UnallocatedItemRequestScalarFieldEnum),
      filters,
    );

    const where: Prisma.UnallocatedItemRequestWhereInput = {
      ...filterWhere,
      title: params.title,
      type: params.type,
      expirationDate: params.expirationDate,
      unitType: params.unitType,
      quantityPerUnit: params.quantityPerUnit,
    };

    const query: Prisma.UnallocatedItemRequestFindManyArgs = {
      where,
      include: {
        partner: {
          select: {
            name: true,
          },
        },
      },
    };

    buildQueryWithPagination(query, page, pageSize);

    const [requests, total] = await Promise.all([
      db.unallocatedItemRequest.findMany(query),
      db.unallocatedItemRequest.count({ where }),
    ]);

    const allocations = await Promise.all(
      requests.map(async (request) => {
        return await db.unallocatedItemRequestAllocation.findMany({
          where: {
            unallocatedItemRequestId: request.id,
          },
          include: {
            unallocatedItem: true,
          },
        });
      })
    );

    const items = await db.item.findMany({
      where: {
        title: params.title,
        type: params.type,
        expirationDate: params.expirationDate,
        unitType: params.unitType,
        quantityPerUnit: params.quantityPerUnit,
      },
    });

    const modifiedItems: UnallocatedItem[] = await Promise.all(
      items.map(async (item) => {
        const quantityAllocated =
          await db.unallocatedItemRequestAllocation.aggregate({
            _sum: {
              quantity: true,
            },
            where: {
              itemId: item.id,
            },
          });
        return {
          ...item,
          quantityLeft: item.quantity - (quantityAllocated._sum.quantity || 0),
        };
      })
    );

    return {
      requests: requests.map((request, index) => ({
        ...request,
        allocations: allocations[index],
      })),
      items: modifiedItems,
      total,
    };
  }
}

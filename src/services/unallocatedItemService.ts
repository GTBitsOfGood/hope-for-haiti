import { db } from "@/db";
import { NotFoundError } from "@/util/errors";
import { UserType } from "@prisma/client";
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

export class UnallocatedItemService {
  static async getUnallocatedItems(params: GetUnallocatedItemsParams) {
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

    const tableItems = (
      await db.item.groupBy({
        by: ["title", "type", "expirationDate", "unitType", "quantityPerUnit"],
        _sum: {
          quantity: true,
        },
        where: {
          ...scopeVisibility,
          ...(params.expirationDateAfter && !params.expirationDateBefore
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
              }),
        },
      })
    ).map((item) => {
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

  static async getPartnerUnallocatedItemRequests(partnerId: number) {
    const requests = await db.unallocatedItemRequest.findMany({
      where: { partnerId },
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
    });

    return requests.map((req) => ({
      ...req,
      expirationDate: req.expirationDate?.toLocaleDateString(),
      createdAt: req.createdAt.toLocaleDateString(),
    }));
  }

  static async getLineItems(params: GetLineItemsParams) {
    const items = await db.item.findMany({
      where: {
        title: params.title,
        type: params.type,
        expirationDate: params.expirationDate,
        unitType: params.unitType,
        quantityPerUnit: params.quantityPerUnit,
      },
    });

    return { items };
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

  static async getUnallocatedItemRequests(params: GetUnallocatedItemRequestsParams) {
    const requests = await db.unallocatedItemRequest.findMany({
      where: {
        title: params.title,
        type: params.type,
        expirationDate: params.expirationDate,
        unitType: params.unitType,
        quantityPerUnit: params.quantityPerUnit,
      },
      include: {
        partner: {
          select: {
            name: true,
          },
        },
      },
    });

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
    };
  }
}

import { db } from "@/db";
import { ArgumentError, NotFoundError } from "@/util/errors";
import {
  CreateAllocationData,
  UpdateAllocationData,
  ItemSearchParams,
  ItemSearchResult,
} from "@/types/api/allocation.types";
import { Prisma } from "@prisma/client";

export default class AllocationService {
  static async createAllocation(data: CreateAllocationData) {
    let itemId: number | undefined;
    if (data.itemId) {
      itemId = data.itemId;
    } else {
      if (
        !data.title ||
        !data.type ||
        !data.expirationDate ||
        !data.unitType ||
        !data.quantityPerUnit ||
        !data.donorName ||
        !data.lotNumber ||
        !data.palletNumber ||
        !data.boxNumber
      ) {
        throw new ArgumentError("Missing required item fields for item search");
      }

      const item = await db.lineItem.findFirst({
        where: {
          generalItem: {
            title: data.title,
            type: data.type,
            expirationDate: data.expirationDate,
            unitType: data.unitType,
            quantityPerUnit: data.quantityPerUnit,
          },
          donorName: data.donorName,
          lotNumber: data.lotNumber,
          palletNumber: data.palletNumber,
          boxNumber: data.boxNumber,
        },
      });

      if (!item) {
        throw new NotFoundError(
          "Line item not found with the specified attributes"
        );
      }

      itemId = item.id;
    }

    console.log("Creating allocation with itemId:", itemId, "and data:", data);
    try {
      return await db.allocation.create({
        data: {
          lineItem: {
            connect: {
              id: itemId,
            },
          },
          partner: {
            connect: data.partnerId ? { id: data.partnerId } : undefined,
          },
          distribution: {
            connect: {
              id: data.distributionId,
            },
          },
          signOff: {
            connect: data.signOffId
              ? {
                  id: data.signOffId,
                }
              : undefined,
          },
        },
        include: {
          partner: {
            select: { id: true, name: true },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002" || error.code === "P2014") {
          throw new ArgumentError("Item is already allocated.");
        }
      }
      throw error;
    }
  }

  static async updateAllocation(
    id: number,
    data: {
      partnerId?: number;
      lineItemId?: number;
      signOffId?: number;
    }
  ) {
    try {
      return await db.allocation.update({
        where: { id },
        data: {
          partnerId: data.partnerId,
          lineItemId: data.lineItemId,
          signOffId: data.signOffId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("Allocation not found");
        }
        if (error.code === "P2002") {
          throw new ArgumentError("Item is already allocated.");
        }
      }
      throw error;
    }
  }

  static async deleteAllocation(id: number) {
    try {
      await db.allocation.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("Allocation not found");
        }
      }
      throw error;
    }
  }

  static async deleteManyAllocations(ids: number[]) {
    await db.allocation.deleteMany({
      where: { id: { in: ids } },
    });
  }

  static async getAllocation(id: number) {
    return db.allocation.findUnique({
      where: { id },
      include: {
        distribution: true,
      },
    });
  }

  /**
   * Connects an allocation to a line item
   */
  static async connectLineItem(data: UpdateAllocationData) {
    const allocation = await db.allocation.findUnique({
      where: { id: data.allocationId },
    });

    if (!allocation) {
      throw new NotFoundError("Allocation not found");
    }

    const item = await db.lineItem.findFirst({
      where: {
        generalItem: {
          title: data.title,
          type: data.type,
          expirationDate: data.expirationDate,
          unitType: data.unitType,
          quantityPerUnit: data.quantityPerUnit,
        },
        donorName: data.donorName,
        lotNumber: data.lotNumber,
        palletNumber: data.palletNumber,
        boxNumber: data.boxNumber,
      },
    });

    if (!item) {
      throw new NotFoundError("Item not found with the specified attributes");
    }

    const updatedAllocation = await db.allocation.update({
      where: { id: data.allocationId },
      data: {
        lineItemId: item.id,
      },
    });

    return updatedAllocation;
  }

  static async searchItems(
    params: ItemSearchParams
  ): Promise<ItemSearchResult> {
    const whereClause: Partial<Prisma.LineItemFindUniqueArgs["where"]> = {
      generalItem: {
        title: params.title,
        type: params.type,
        expirationDate: params.expirationDate,
        unitType: params.unitType,
        quantityPerUnit: params.quantityPerUnit,
      },
    };

    if (params.donorName) whereClause.donorName = params.donorName;
    if (params.lotNumber) whereClause.lotNumber = params.lotNumber;
    if (params.palletNumber) whereClause.palletNumber = params.palletNumber;
    if (params.boxNumber) whereClause.boxNumber = params.boxNumber;

    const items = await db.lineItem.findMany({
      where: whereClause,
    });

    const donorNames = new Set<string>();
    const lotNumbers = new Set<string>();
    const palletNumbers = new Set<string>();
    const boxNumbers = new Set<string>();

    for (const item of items) {
      donorNames.add(item.donorName);
      lotNumbers.add(item.lotNumber);
      palletNumbers.add(item.palletNumber);
      boxNumbers.add(item.boxNumber);
    }

    return {
      donorNames: Array.from(donorNames),
      lotNumbers: Array.from(lotNumbers),
      palletNumbers: Array.from(palletNumbers),
      boxNumbers: Array.from(boxNumbers),
    };
  }
}

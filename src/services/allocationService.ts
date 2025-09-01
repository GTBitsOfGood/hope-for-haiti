import { db } from "@/db";
import { ArgumentError, NotFoundError, ConflictError } from "@/util/errors";
import { 
  CreateAllocationData, 
  UpdateAllocationData, 
  ItemSearchParams, 
  ItemSearchResult 
} from "@/types/api/allocation.types";

export default class AllocationService {
  static async createAllocation(data: CreateAllocationData) {
    if (data.unallocatedItemRequestId && data.partnerId) {
      throw new ArgumentError("Cannot specify both unallocatedItemRequestId and partnerId");
    }

    if (!data.unallocatedItemRequestId && !data.partnerId && !data.donorOfferItemRequestId) {
      throw new ArgumentError("Must specify either unallocatedItemRequestId, partnerId, or donorOfferItemRequestId");
    }

    let item;
    if (data.itemId) {
      item = await db.item.findUnique({
        where: { id: data.itemId },
      });
    } else {
      if (!data.title || !data.type || !data.expirationDate || !data.unitType || 
          !data.quantityPerUnit || !data.donorName || !data.lotNumber || 
          !data.palletNumber || !data.boxNumber) {
        throw new ArgumentError("Missing required item fields for item search");
      }

      item = await db.item.findFirst({
        where: {
          title: data.title,
          type: data.type,
          expirationDate: data.expirationDate,
          unitType: data.unitType,
          quantityPerUnit: data.quantityPerUnit,
          donorName: data.donorName,
          lotNumber: data.lotNumber,
          palletNumber: data.palletNumber,
          boxNumber: data.boxNumber,
        },
      });
    }

    if (!item) {
      throw new NotFoundError("Item not found with the specified attributes");
    }

    if (data.unallocatedItemRequestId) {
      const allocation = await db.unallocatedItemRequestAllocation.create({
        data: {
          unallocatedItemRequestId: data.unallocatedItemRequestId,
          itemId: item.id,
          quantity: data.quantity,
          visible: data.visible,
        },
      });
      return { type: "unallocated", allocation };
    } else if (data.donorOfferItemRequestId) {
      const allocation = await db.donorOfferItemRequestAllocation.create({
        data: {
          donorOfferItemRequestId: data.donorOfferItemRequestId,
          itemId: item.id,
          quantity: data.quantity,
          visible: data.visible,
        },
      });
      return { type: "donorOffer", allocation };
    } else {
      const allocation = await db.unallocatedItemRequestAllocation.create({
        data: {
          partnerId: data.partnerId!,
          itemId: item.id,
          quantity: data.quantity,
          visible: data.visible,
        },
      });
      return { type: "unallocated", allocation };
    }
  }

  static async updateAllocation(data: UpdateAllocationData) {
    const allocation = await db.unallocatedItemRequestAllocation.findUnique({
      where: { id: data.allocationId },
      include: { unallocatedItemRequest: true },
    });

    if (!allocation) {
      throw new NotFoundError("Allocation not found");
    }

    const item = await db.item.findFirst({
      where: {
        title: data.title,
        type: data.type,
        expirationDate: data.expirationDate,
        unitType: data.unitType,
        quantityPerUnit: data.quantityPerUnit,
        donorName: data.donorName,
        lotNumber: data.lotNumber,
        palletNumber: data.palletNumber,
        boxNumber: data.boxNumber,
      },
    });

    if (!item) {
      throw new NotFoundError("Item not found with the specified attributes");
    }

    const totalAllocated = await db.unallocatedItemRequestAllocation.aggregate({
      _sum: { quantity: true },
      where: {
        itemId: item.id,
        NOT: { id: data.allocationId },
      },
    });

    const availableQuantity = item.quantity - (totalAllocated._sum.quantity || 0);
    if (availableQuantity < data.quantity) {
      throw new ConflictError("Not enough items in inventory to fulfill the allocation request");
    }

    const updatedAllocation = await db.unallocatedItemRequestAllocation.update({
      where: { id: data.allocationId },
      data: {
        itemId: item.id,
        quantity: data.quantity,
      },
    });

    return updatedAllocation;
  }

  static async searchItems(params: ItemSearchParams): Promise<ItemSearchResult> {
    const whereClause: Record<string, unknown> = {
      title: params.title,
      type: params.type,
      expirationDate: params.expirationDate,
      unitType: params.unitType,
      quantityPerUnit: params.quantityPerUnit,
    };

    if (params.donorName) whereClause.donorName = params.donorName;
    if (params.lotNumber) whereClause.lotNumber = params.lotNumber;
    if (params.palletNumber) whereClause.palletNumber = params.palletNumber;
    if (params.boxNumber) whereClause.boxNumber = params.boxNumber;

    const items = await db.item.findMany({
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

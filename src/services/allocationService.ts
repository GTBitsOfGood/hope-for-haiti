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
    // Check if partner is enabled and not pending if partnerId is provided
    if (data.partnerId) {
      const partner = await db.user.findUnique({
        where: { id: data.partnerId },
        select: { enabled: true, pending: true, type: true },
      });

      if (!partner) {
        throw new NotFoundError("Partner not found");
      }

      if (!partner.enabled) {
        throw new ArgumentError("Cannot create allocation for deactivated partner");
      }

      if (partner.pending) {
        throw new ArgumentError("Cannot create allocation for pending partner");
      }
    }
    
    let itemId: number | undefined;
    if (data.itemId) {
      itemId = data.itemId;
      
      // Check if the line item belongs to an archived donor offer
      const lineItem = await db.lineItem.findUnique({
        where: { id: itemId },
        include: {
          generalItem: {
            include: {
              donorOffer: {
                select: { state: true }
              }
            }
          }
        }
      });

      if (lineItem?.generalItem?.donorOffer?.state === "ARCHIVED") {
        throw new ArgumentError("Cannot create allocations for archived donor offers. Archived offers are read-only.");
      }
    } else {
      if (
        !data.title ||
        !data.expirationDate ||
        !data.unitType ||
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
            expirationDate: data.expirationDate,
            unitType: data.unitType,
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

  static async createBatchAllocations(
    distributionId: number,
    allocations: { partnerId: number; lineItemId: number }[]
  ) {
    if (!allocations.length) {
      throw new ArgumentError(
        "Allocations payload must include at least one allocation"
      );
    }

    // Check if all partners are enabled and not pending
    const partnerIds = [...new Set(allocations.map(a => a.partnerId))];
    const partners = await db.user.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, enabled: true, pending: true },
    });

    const validPartnerIds = new Set(
      partners.filter(p => p.enabled && !p.pending).map(p => p.id)
    );

    const invalidPartnerIds = partnerIds.filter(
      id => !validPartnerIds.has(id)
    );

    if (invalidPartnerIds.length > 0) {
      throw new ArgumentError(
        `Cannot create allocations for deactivated or pending partners: ${invalidPartnerIds.join(", ")}`
      );
    }

    // Check if any line items belong to archived donor offers
    const lineItemIds = allocations.map(a => a.lineItemId);
    const lineItems = await db.lineItem.findMany({
      where: { id: { in: lineItemIds } },
      include: {
        generalItem: {
          include: {
            donorOffer: {
              select: { state: true }
            }
          }
        }
      }
    });

    const archivedLineItems = lineItems.filter(
      li => li.generalItem?.donorOffer?.state === "ARCHIVED"
    );

    if (archivedLineItems.length > 0) {
      throw new ArgumentError(
        "Cannot create allocations for archived donor offers. Archived offers are read-only."
      );
    }

    try {
      return await db.$transaction(
        allocations.map((allocation) =>
          db.allocation.create({
            data: {
              distributionId,
              partnerId: allocation.partnerId,
              lineItemId: allocation.lineItemId,
            },
            include: {
              partner: {
                select: { id: true, name: true },
              },
            },
          })
        )
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002" || error.code === "P2014") {
          throw new ArgumentError("One or more items are already allocated.");
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
    // Check if partner is enabled and not pending if partnerId is being updated
    if (data.partnerId) {
      const partner = await db.user.findUnique({
        where: { id: data.partnerId },
        select: { enabled: true, pending: true },
      });

      if (!partner) {
        throw new NotFoundError("Partner not found");
      }

      if (!partner.enabled) {
        throw new ArgumentError("Cannot update allocation to deactivated partner");
      }

      if (partner.pending) {
        throw new ArgumentError("Cannot update allocation to pending partner");
      }
    }
    
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

  static async updateAllocationBatch(
    ids: number[],
    update: {
      partnerId?: number;
      distributionId?: number;
    }
  ) {
    try {
      return await db.allocation.updateMany({
        where: { id: { in: ids } },
        data: {
          partnerId: update.partnerId,
          distributionId: update.distributionId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("One or more allocations not found");
        }
      }
      throw error;
    }
  }

  static async deleteAllocation(id: number) {
    try {
      // Check if the allocation's line item belongs to an archived donor offer
      const allocation = await db.allocation.findUnique({
        where: { id },
        include: {
          lineItem: {
            include: {
              generalItem: {
                include: {
                  donorOffer: {
                    select: { state: true }
                  }
                }
              }
            }
          }
        }
      });

      if (allocation?.lineItem?.generalItem?.donorOffer?.state === "ARCHIVED") {
        throw new ArgumentError("Cannot delete allocations for archived donor offers. Archived offers are read-only.");
      }

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
          expirationDate: data.expirationDate,
          unitType: data.unitType,
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
        expirationDate: params.expirationDate,
        unitType: params.unitType,
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

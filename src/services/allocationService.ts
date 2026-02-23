import { db } from "@/db";
import { ArgumentError, NotFoundError } from "@/util/errors";
import {
  CreateAllocationData,
  UpdateAllocationData,
  ItemSearchParams,
  ItemSearchResult,
  PartnerAllocation,
  PartnerAllocationsResponse,
} from "@/types/api/allocation.types";
import { Prisma, ShipmentStatus } from "@prisma/client";
import { Filters } from "@/types/api/filter.types";
import { buildQueryWithPagination, buildWhereFromFilters } from "@/util/table";
import {
  hasShippingIdentifier,
  shippingTupleKey,
} from "@/util/shipping";

export default class AllocationService {
  static async createAllocation(data: CreateAllocationData) {
    if (data.partnerId) {
      const partner = await db.user.findUnique({
        where: { id: data.partnerId },
        select: { enabled: true, pending: true, type: true },
      });

      if (!partner) {
        throw new NotFoundError("Partner not found");
      }

      if (!partner.enabled) {
        throw new ArgumentError(
          "Cannot create allocation for deactivated partner"
        );
      }

      if (partner.pending) {
        throw new ArgumentError("Cannot create allocation for pending partner");
      }
    }

    let itemId: number | undefined;
    if (data.itemId) {
      itemId = data.itemId;
      
      // Check if the line item exists and is unallocated
      const lineItem = await db.lineItem.findUnique({
        where: { id: itemId },
        include: {
          allocation: true,
          generalItem: {
            include: {
              donorOffer: {
                select: { state: true }
              }
            }
          }
        }
      });

      if (!lineItem) {
        throw new NotFoundError("Line item not found");
      }

      if (lineItem.allocation) {
        throw new ArgumentError("Line item is already allocated");
      }

      // For ARCHIVED offers: Allow allocation if the line item is unallocated (which we just verified)
      // For UNFINALIZED offers: Block allocation (items should be finalized first)
      if (lineItem.generalItem?.donorOffer?.state === "UNFINALIZED") {
        throw new ArgumentError("Cannot create allocations for unfinalized donor offers. Please finalize the offer first.");
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
    const partnerIds = [...new Set(allocations.map((a) => a.partnerId))];
    const partners = await db.user.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, enabled: true, pending: true },
    });

    const validPartnerIds = new Set(
      partners.filter((p) => p.enabled && !p.pending).map((p) => p.id)
    );

    const invalidPartnerIds = partnerIds.filter(
      (id) => !validPartnerIds.has(id)
    );

    if (invalidPartnerIds.length > 0) {
      throw new ArgumentError(
        `Cannot create allocations for deactivated or pending partners: ${invalidPartnerIds.join(", ")}`
      );
    }

    // Check if any line items belong to unfinalized donor offers
    const lineItemIds = allocations.map(a => a.lineItemId);
    const lineItems = await db.lineItem.findMany({
      where: { id: { in: lineItemIds } },
      include: {
        allocation: true,
        generalItem: {
          include: {
            donorOffer: {
              select: { state: true },
            },
          },
        },
      },
    });

    // Check if any are already allocated
    const alreadyAllocatedItems = lineItems.filter(li => li.allocation !== null);
    if (alreadyAllocatedItems.length > 0) {
      throw new ArgumentError(
        "One or more line items are already allocated."
      );
    }

    // Block allocations for UNFINALIZED offers (must be finalized first)
    const unfinalizedLineItems = lineItems.filter(
      li => li.generalItem?.donorOffer?.state === "UNFINALIZED"
    );

    if (unfinalizedLineItems.length > 0) {
      throw new ArgumentError(
        "Cannot create allocations for unfinalized donor offers. Please finalize the offer first."
      );
    }

    // ARCHIVED and FINALIZED offers with unallocated line items are OK to allocate

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
        throw new ArgumentError(
          "Cannot update allocation to deactivated partner"
        );
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
      // Check if any allocations belong to an approved distribution
      const allocations = await db.allocation.findMany({
        where: { id: { in: ids } },
        include: {
          distribution: true,
        },
      });

      for (const allocation of allocations) {
        if (!allocation.distribution.pending) {
          throw new ArgumentError(
            "Cannot transfer items from an approved distribution. Approved distributions are locked."
          );
        }
      }

      if (update.distributionId) {
        const targetDistribution = await db.distribution.findUnique({
          where: { id: update.distributionId },
        });

        if (!targetDistribution) {
          throw new NotFoundError("Target distribution not found");
        }

        if (!targetDistribution.pending) {
          throw new ArgumentError(
            "Cannot transfer items to an approved distribution. Transfers are only allowed between pending distributions."
          );
        }
      }

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
      // Check if the allocation belongs to an approved distribution
      const allocation = await db.allocation.findUnique({
        where: { id },
        include: {
          distribution: true,
          lineItem: {
            include: {
              generalItem: {
                include: {
                  donorOffer: {
                    select: { state: true },
                  },
                },
              },
            },
          },
        },
      });

      if (allocation && !allocation.distribution.pending) {
        throw new ArgumentError(
          "Cannot remove items from an approved distribution. Approved distributions are locked."
        );
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
    // Check if any allocations belong to an approved distribution
    const allocations = await db.allocation.findMany({
      where: { id: { in: ids } },
      include: {
        distribution: true,
      },
    });

    for (const allocation of allocations) {
      if (!allocation.distribution.pending) {
        throw new ArgumentError(
          "Cannot remove items from an approved distribution. Approved distributions are locked."
        );
      }
    }

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

  static async getPartnerAllocations(
    partnerId: number,
    completed: boolean,
    page?: number,
    pageSize?: number,
    filters?: Filters
  ): Promise<PartnerAllocationsResponse> {
    const partner = await db.user.findUnique({
      where: { id: partnerId },
      select: { enabled: true, pending: true },
    });

    if (!partner?.enabled || partner?.pending) {
      return { data: [], total: 0 };
    }

    const allocationWhere: Prisma.AllocationWhereInput = {
      partnerId,
      distribution: {
        pending: false,
      },
    };

    if (completed) {
      allocationWhere.signOffId = { not: null };
    } else {
      allocationWhere.signOffId = null;
    }

    const filterWhere = buildWhereFromFilters<Prisma.AllocationWhereInput>(
      Object.keys(Prisma.AllocationScalarFieldEnum),
      filters
    );

    const finalWhere = {
      ...allocationWhere,
      ...filterWhere,
    };

    const query = Prisma.validator<Prisma.AllocationFindManyArgs>()({
      where: finalWhere,
      include: {
        lineItem: {
          include: {
            generalItem: true,
          },
        },
        signOff: true,
      },
      orderBy: completed ? { signOff: { date: "desc" } } : { id: "desc" },
    });

    buildQueryWithPagination(query, page, pageSize);

    const [allocations, total] = await Promise.all([
      db.allocation.findMany(query),
      db.allocation.count({ where: finalWhere }),
    ]);

    const shippingNumberPairs = allocations
      .map((a) => ({
        donorShippingNumber: a.lineItem.donorShippingNumber,
        hfhShippingNumber: a.lineItem.hfhShippingNumber,
      }))
      .filter((pair) => hasShippingIdentifier(pair));

    const lookupPairs = shippingNumberPairs.filter(
      (
        pair
      ): pair is { donorShippingNumber: string; hfhShippingNumber: string } =>
        Boolean(pair.donorShippingNumber && pair.hfhShippingNumber)
    );

    const statusMap = new Map<string, ShipmentStatus>();
    if (lookupPairs.length > 0) {
      const statusRecords = await db.shippingStatus.findMany({
        where: {
          OR: lookupPairs.map((pair) => ({
            donorShippingNumber: pair.donorShippingNumber,
            hfhShippingNumber: pair.hfhShippingNumber,
          })),
        },
      });

      statusRecords.forEach((status) => {
        const key = shippingTupleKey(status);
        statusMap.set(key, status.value);
      });
    }

    const data: PartnerAllocation[] = allocations.map((allocation) => {
      let shipmentStatus: ShipmentStatus | undefined;
      const tuple = {
        donorShippingNumber: allocation.lineItem.donorShippingNumber,
        hfhShippingNumber: allocation.lineItem.hfhShippingNumber,
      };
      if (hasShippingIdentifier(tuple)) {
        const key = shippingTupleKey(tuple);
        shipmentStatus = statusMap.get(key);
      }

      return {
        id: allocation.id,
        generalItemTitle: allocation.lineItem.generalItem?.title || "",
        lotNumber: allocation.lineItem.lotNumber,
        palletNumber: allocation.lineItem.palletNumber,
        boxNumber: allocation.lineItem.boxNumber,
        quantity: allocation.lineItem.quantity,
        donorName: allocation.lineItem.donorName,
        shipmentStatus:
          shipmentStatus ?? ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR,
        signOffDate: allocation.signOff?.date,
        signOffStaffMemberName: allocation.signOff?.staffMemberName,
        signOffId: allocation.signOff?.id,
        signOffSignatureUrl: allocation.signOff?.signatureUrl || undefined,
      };
    });

    return { data, total };
  }
}

import { db } from "@/db";
import { Prisma, UserType, ShipmentStatus } from "@prisma/client";
import { format } from "date-fns";
import { ArgumentError, NotFoundError } from "@/util/errors";
import {
  AllocatedItem,
  DistributionItem,
  SignedDistribution,
  PartnerDistributionsResult,
  DistributionRecord,
  AdminDistributionsResult,
  CompletedSignOff,
  PartnerAllocationSummary,
  CompletedSignOffResponse,
  PartnerAllocationSummaryResponse
} from "@/types/api/distribution.types";
import { Filters } from "@/types/api/filter.types";
import { buildQueryWithPagination, buildWhereFromFilters } from "@/util/table";

export default class DistributionService {
  static async getSignedDistributions(partnerId: number): Promise<SignedDistribution[]> {
    const signOffs = await db.signOff.findMany({
      where: { partnerId },
      include: { distributions: true },
    });

    return signOffs.map((signOff) => ({
      signOffId: signOff.id,
      distributionDate: format(signOff.createdAt, "yyyy-MM-dd"),
      numberOfItems: signOff.distributions.length,
    }));
  }

  static async getPartnerDistributionItems(partnerId: number): Promise<DistributionItem[]> {
    const distributions = await db.distribution.findMany({
      where: { partnerId },
      include: {
        unallocatedItemAllocation: true,
        donorOfferItemAllocation: true,
      },
    });

    const items: DistributionItem[] = [];

    for (const distribution of distributions) {
      const allocation =
        distribution.unallocatedItemAllocation ??
        distribution.donorOfferItemAllocation;

      if (allocation) {
        const item = await db.item.findUnique({
          where: { id: allocation.itemId },
        });

        if (item?.donorShippingNumber && item.hfhShippingNumber) {
          const shippingStatus = await db.shippingStatus.findFirst({
            where: {
              hfhShippingNumber: item.hfhShippingNumber,
              donorShippingNumber: item.donorShippingNumber,
            },
          });

          if (shippingStatus) {
            items.push({
              ...item,
              shipmentStatus: shippingStatus.value,
              quantityAllocated: allocation.quantity,
            });
          }
        }
      }
    }

    const map = new Map<number, DistributionItem>();
    for (const item of items) {
      if (map.has(item.id)) {
        const existing = map.get(item.id)!;
        existing.quantityAllocated += item.quantityAllocated;
      } else {
        map.set(item.id, item);
      }
    }

    return Array.from(map.values());
  }

  static async getPartnerDistributions(partnerId: number): Promise<PartnerDistributionsResult> {
    const distributionItems = await this.getPartnerDistributionItems(partnerId);
    const signed = await this.getSignedDistributions(partnerId);

    const items: AllocatedItem[] = [];
    
    const unallocatedAllocations = await db.unallocatedItemRequestAllocation.findMany({
      where: {
        OR: [
          {
            visible: true,
            unallocatedItemRequest: { partnerId },
            distributions: { none: {} },
          },
          { visible: true, partnerId, distributions: { none: {} } },
        ],
      },
      include: {
        unallocatedItem: true,
      },
    });

    unallocatedAllocations.forEach((alloc) => {
      items.push({
        title: alloc.unallocatedItem.title,
        type: alloc.unallocatedItem.type,
        expirationDate: alloc.unallocatedItem.expirationDate,
        unitType: alloc.unallocatedItem.unitType,
        quantityPerUnit: alloc.unallocatedItem.quantityPerUnit,
        quantityAllocated: alloc.quantity,
        shipmentStatus: ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR,
      });
    });

    const donorOfferAllocations = await db.donorOfferItemRequestAllocation.findMany({
      where: {
        visible: true,
        donorOfferItemRequest: {
          partnerId,
        },
        distributions: { none: {} },
      },
      include: {
        item: true,
      },
    });

    donorOfferAllocations.forEach((alloc) => {
      items.push({
        title: alloc.item.title,
        type: alloc.item.type,
        expirationDate: alloc.item.expirationDate,
        unitType: alloc.item.unitType,
        quantityPerUnit: alloc.item.quantityPerUnit,
        quantityAllocated: alloc.quantity,
        shipmentStatus: ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR,
      });
    });

    return {
      items,
      distributionItems,
      signedDistributions: signed.sort(
        (a, b) =>
          new Date(b.distributionDate).getTime() -
          new Date(a.distributionDate).getTime()
      ),
    };
  }

  static async getAdminDistributions(partnerId: number, visible: boolean | null): Promise<AdminDistributionsResult> {
    const partner = await db.user.findUnique({ where: { id: partnerId } });
    if (!partner || partner.type !== UserType.PARTNER) {
      throw new ArgumentError("Partner not found");
    }

    const records: DistributionRecord[] = [];
    const baseWhere = visible !== null ? { visible } : {};

    const unallocatedAllocations = await db.unallocatedItemRequestAllocation.findMany({
      where: {
        OR: [
          { ...baseWhere, unallocatedItemRequest: { partnerId } },
          { ...baseWhere, partnerId },
        ],
      },
      include: {
        unallocatedItem: true,
      },
    });

    unallocatedAllocations.forEach((alloc) => {
      records.push({
        allocationType: "unallocated",
        allocationId: alloc.id,
        title: alloc.unallocatedItem.title,
        unitType: alloc.unallocatedItem.unitType,
        donorName: alloc.unallocatedItem.donorName,
        lotNumber: alloc.unallocatedItem.lotNumber,
        palletNumber: alloc.unallocatedItem.palletNumber,
        boxNumber: alloc.unallocatedItem.boxNumber,
        unitPrice: alloc.unallocatedItem.unitPrice.toNumber(),
        quantityAllocated: alloc.quantity,
        quantityAvailable: 999,
        quantityTotal: 999,
        donorShippingNumber: alloc.unallocatedItem.donorShippingNumber,
        hfhShippingNumber: alloc.unallocatedItem.hfhShippingNumber,
      });
    });

    const donorOfferAllocations = await db.donorOfferItemRequestAllocation.findMany({
      where: {
        ...baseWhere,
        donorOfferItemRequest: {
          partnerId,
        },
      },
      include: {
        item: true,
      },
    });

    donorOfferAllocations.forEach((alloc) => {
      records.push({
        allocationType: "donorOffer",
        allocationId: alloc.id,
        title: alloc.item.title,
        unitType: alloc.item.unitType,
        donorName: alloc.item.donorName,
        lotNumber: alloc.item.lotNumber,
        palletNumber: alloc.item.palletNumber,
        boxNumber: alloc.item.boxNumber,
        unitPrice: alloc.item.unitPrice.toNumber(),
        quantityAllocated: alloc.quantity,
        quantityAvailable: 999,
        quantityTotal: 999,
        donorShippingNumber: alloc.item.donorShippingNumber,
        hfhShippingNumber: alloc.item.hfhShippingNumber,
      });
    });

    return { records };
  }

  static async getCompletedSignOffs(
    filters?: Filters,
    page?: number,
    pageSize?: number,
  ): Promise<CompletedSignOffResponse> {
    const where = buildWhereFromFilters<Prisma.SignOffWhereInput>(
      Object.keys(Prisma.SignOffScalarFieldEnum),
      filters,
    );

    const query: Prisma.SignOffFindManyArgs = {
      where,
      select: {
        partnerName: true,
        staffMemberName: true,
        date: true,
        createdAt: true,
        _count: {
          select: {
            distributions: true,
          },
        },
      },
    };

    buildQueryWithPagination(query, page, pageSize);

    const [signoffs, total] = await Promise.all([
      db.signOff.findMany(query),
      db.signOff.count({ where }),
    ]);

    const mapped: CompletedSignOff[] = signoffs.map((signoff) => ({
      partnerName: signoff.partnerName,
      staffMemberName: signoff.staffMemberName,
      date: signoff.date,
      createdAt: signoff.createdAt,
      distributionCount: signoff._count.distributions,
    }));

    return { signoffs: mapped, total };
  }

  static async getPartnerAllocationSummaries(
    filters?: Filters,
    page?: number,
    pageSize?: number,
  ): Promise<PartnerAllocationSummaryResponse> {
    const filterWhere = buildWhereFromFilters<Prisma.UserWhereInput>(
      Object.keys(Prisma.UserScalarFieldEnum),
      filters,
    );

    const where: Prisma.UserWhereInput = {
      ...filterWhere,
      type: "PARTNER",
    };

    const query: Prisma.UserFindManyArgs = {
      where,
      include: {
        unallocatedItemRequests: {
          include: {
            allocations: true,
          },
        },
        donorOfferItemRequests: {
          include: {
            DonorOfferItemRequestAllocation: true,
          },
        },
        unallocatedItemRequestAllocations: true,
        distributions: true,
        _count: {
          select: {
            distributions: {
              where: {
                signOff: {
                  signatureUrl: null,
                },
              },
            },
          },
        },
      },
    };

    buildQueryWithPagination(query, page, pageSize);

    const [usersWithAllocations, total] = await Promise.all([
      db.user.findMany(query),
      db.user.count({ where }),
    ]);

    const mapped: PartnerAllocationSummary[] = usersWithAllocations.map((user) => {
      const unallocatedRequestAllocations = user.unallocatedItemRequests.flatMap(
        (request) => request.allocations || []
      );

      const donorOfferRequestAllocations = user.donorOfferItemRequests.flatMap(
        (request) => request.DonorOfferItemRequestAllocation || []
      );

      const allAllocations = [
        ...user.unallocatedItemRequestAllocations,
        ...unallocatedRequestAllocations,
        ...donorOfferRequestAllocations,
      ];

      const visibleAllocations = allAllocations.filter(
        (allocation) => allocation.visible
      );
      const hiddenAllocations = allAllocations.filter(
        (allocation) => !allocation.visible
      );

      return {
        partnerId: user.id,
        partnerName: user.name,
        visibleAllocationsCount: visibleAllocations.length,
        hiddenAllocationsCount: hiddenAllocations.length,
        pendingSignOffCount: user._count.distributions,
      };
    });

    return { data: mapped, total };
  }

  static async toggleAllocationVisibility(allocType: "unallocated" | "donorOffer", id: number, visible: boolean): Promise<void> {
    if (allocType === "unallocated") {
      await db.unallocatedItemRequestAllocation.update({
        where: { id },
        data: { visible },
      });
    } else {
      await db.donorOfferItemRequestAllocation.update({
        where: { id },
        data: { visible },
      });
    }
  }

  static async togglePartnerVisibility(partnerId: number, visible: boolean): Promise<void> {
    await db.$transaction(async (tx) => {
      await tx.unallocatedItemRequestAllocation.updateMany({
        where: { 
          OR: [
            { partnerId }, 
            { unallocatedItemRequest: { partnerId } }
          ] 
        },
        data: { visible },
      });
      
      await tx.donorOfferItemRequestAllocation.updateMany({
        where: { donorOfferItemRequest: { partnerId } },
        data: { visible },
      });
    });
  }

  static async deleteDistribution(distributionId: number): Promise<void> {
    const distribution = await db.distribution.findUnique({
      where: { id: distributionId },
    });

    if (!distribution) {
      throw new NotFoundError("Distribution not found");
    }

    await db.distribution.delete({
      where: { id: distributionId },
    });
  }
}

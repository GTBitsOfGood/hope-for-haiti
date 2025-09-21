import { db } from "@/db";
import { UserType } from "@prisma/client";
import { format } from "date-fns";
import { ArgumentError, NotFoundError } from "@/util/errors";
import {
  DistributionItem,
  SignedDistribution,
  PartnerDistributionsResult,
  DistributionRecord,
  AdminDistributionsResult,
  CompletedSignOff,
  PartnerAllocationSummary,
} from "@/types/api/distribution.types";

export default class DistributionService {
  static async getSignedDistributions(
    partnerId: number
  ): Promise<SignedDistribution[]> {
    const signOffs = await db.signOff.findMany({
      where: { partnerId },
      include: { allocations: true },
    });

    return signOffs.map((signOff) => ({
      signOffId: signOff.id,
      distributionDate: format(signOff.createdAt, "yyyy-MM-dd"),
      numberOfItems: signOff.allocations.length,
    }));
  }

  static async getPartnerDistributionItems(
    partnerId: number
  ): Promise<DistributionItem[]> {
    const distributions = await db.distribution.findMany({
      where: { partner: { id: partnerId } },
      include: {
        allocations: true,
      },
    });

    const items: DistributionItem[] = [];

    for (const distribution of distributions) {
      for (const allocation of distribution.allocations) {
        // const item = await db.item.findUnique({
        //   where: { id: allocation.itemId },
        // });
        const item = await db.lineItem.findUnique({
          where: { id: allocation.lineItemId },
        });

        if (!item)
          throw new NotFoundError(`Item ${allocation.lineItemId} not found`);

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
              quantityAllocated: item.quantity,
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

  static async getPartnerDistributions(
    partnerId: number
  ): Promise<PartnerDistributionsResult> {
    const distributionItemPromise = this.getPartnerDistributionItems(partnerId);
    const signedDistributionPromise = this.getSignedDistributions(partnerId);

    return {
      distributionItems: await distributionItemPromise,
      signedDistributions: (await signedDistributionPromise).sort(
        (a, b) =>
          new Date(b.distributionDate).getTime() -
          new Date(a.distributionDate).getTime()
      ),
    };
  }

  static async getAdminDistributions(
    partnerId: number,
    visible: boolean | null
  ): Promise<AdminDistributionsResult> {
    const partner = await db.user.findUnique({ where: { id: partnerId } });
    if (!partner || partner.type !== UserType.PARTNER) {
      throw new ArgumentError("Partner not found");
    }

    const records: DistributionRecord[] = [];
    const baseWhere = visible !== null ? { visible } : {};

    const unallocatedAllocations =
      await db.unallocatedItemRequestAllocation.findMany({
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

    const donorOfferAllocations =
      await db.donorOfferItemRequestAllocation.findMany({
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

  static async getCompletedSignOffs(): Promise<CompletedSignOff[]> {
    const signoffs = await db.signOff.findMany({
      select: {
        partnerName: true,
        staffMemberName: true,
        date: true,
        createdAt: true,
        _count: {
          select: {
            allocations: true,
          },
        },
      },
    });

    return signoffs.map((signoff) => ({
      partnerName: signoff.partnerName,
      staffMemberName: signoff.staffMemberName,
      date: signoff.date,
      createdAt: signoff.createdAt,
      allocationCount: signoff._count.allocations,
    }));
  }

  static async getPartnerAllocationSummaries(): Promise<
    PartnerAllocationSummary[]
  > {
    const usersWithAllocations = await db.user.findMany({
      where: {
        type: "PARTNER",
      },
      include: {
        distributions: true,
        _count: {
          select: {
            distributions: {
              where: {
                allocations: {
                  none: {
                    signOff: {
                      signatureUrl: null,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return usersWithAllocations.map((user) => {
      const unallocatedRequestAllocations =
        user.unallocatedItemRequests.flatMap(
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
  }

  static async toggleAllocationVisibility(
    allocType: "unallocated" | "donorOffer",
    id: number,
    visible: boolean
  ): Promise<void> {
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

  static async togglePartnerVisibility(
    partnerId: number,
    visible: boolean
  ): Promise<void> {
    await db.$transaction(async (tx) => {
      await tx.unallocatedItemRequestAllocation.updateMany({
        where: {
          OR: [{ partnerId }, { unallocatedItemRequest: { partnerId } }],
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

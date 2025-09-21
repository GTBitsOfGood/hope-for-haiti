import { db } from "@/db";
import { format } from "date-fns";
import { NotFoundError } from "@/util/errors";
import {
  DistributionItem,
  SignedDistribution,
  PartnerDistributionsResult,
  CompletedSignOff,
  PartnerAllocationSummary,
} from "@/types/api/distribution.types";

export default class DistributionService {
  static async getSignedDistributions(
    partnerId?: number
  ): Promise<SignedDistribution[]> {
    const signOffs = await db.signOff.findMany({
      where: partnerId ? { partnerId } : {},
      include: { allocations: true },
    });

    return signOffs.map((signOff) => ({
      signOffId: signOff.id,
      distributionDate: format(signOff.createdAt, "yyyy-MM-dd"),
      numberOfItems: signOff.allocations.length,
    }));
  }

  static async getPartnerDistributionItems(
    partnerId?: number
  ): Promise<DistributionItem[]> {
    const distributions = await db.distribution.findMany({
      where: partnerId ? { partner: { id: partnerId } } : {},
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
    const signOffsByPartnerIdPromise = db.signOff
      .groupBy({
        by: ["partnerId"],
        _count: true,
      })
      .then((results) =>
        results.reduce(
          (acc, r) => {
            acc[r.partnerId] = r._count;
            return acc;
          },
          {} as Record<number, number>
        )
      );

    const usersWithAllocationsPromise = db.user.findMany({
      where: {
        type: "PARTNER",
      },
      include: {
        allocations: true,
        _count: {
          select: {
            allocations: true,
          },
        },
      },
    });

    const [signOffsByPartnerId, usersWithAllocations] = await Promise.all([
      signOffsByPartnerIdPromise,
      usersWithAllocationsPromise,
    ]);

    return usersWithAllocations.map((user) => {
      return {
        partnerId: user.id,
        partnerName: user.name,
        allocationsCount: user._count.allocations,
        pendingSignOffCount: signOffsByPartnerId[user.id] || 0,
      };
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

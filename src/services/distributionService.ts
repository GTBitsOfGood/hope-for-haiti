import { db } from "@/db";
import { format } from "date-fns";
import { NotFoundError, ArgumentError } from "@/util/errors";
import {
  DistributionItem,
  SignedDistribution,
  PartnerDistributionsResult,
  CompletedSignOff,
  PartnerAllocationSummary,
  CompletedSignOffResponse,
  PartnerAllocationSummaryResponse,
} from "@/types/api/distribution.types";
import { Prisma } from "@prisma/client";
import { Filters } from "@/types/api/filter.types";
import { buildQueryWithPagination, buildWhereFromFilters } from "@/util/table";

export default class DistributionService {
  static async getAllDistributions() {
    return db.distribution.findMany();
  }

  static async getDistributionsForDonorOffer(
    donorOfferId: number
  ): Promise<
    Record<
      number,
      {
        id: number;
        partnerId: number;
        partnerName: string;
        pending: boolean;
      }[]
    >
  > {
    const distributions = await db.distribution.findMany({
      where: {
        allocations: {
          some: {
            lineItem: {
              generalItem: {
                donorOfferId,
              },
            },
          },
        },
        partner: {
          enabled: true,
        },
      },
      select: {
        id: true,
        partnerId: true,
        pending: true,
        partner: {
          select: {
            name: true,
          },
        },
      },
    });

    return distributions.reduce(
      (acc, distribution) => {
        const bucket = acc[distribution.partnerId] ?? [];
        bucket.push({
          id: distribution.id,
          partnerId: distribution.partnerId,
          partnerName: distribution.partner.name,
          pending: distribution.pending,
        });
        acc[distribution.partnerId] = bucket;
        return acc;
      },
      {} as Record<
        number,
        {
          id: number;
          partnerId: number;
          partnerName: string;
          pending: boolean;
        }[]
      >
    );
  }

  static async getDistribution(id: number) {
    const distribution = await db.distribution.findUnique({
      where: { id },
      include: { allocations: true },
    });

    if (!distribution) {
      throw new NotFoundError("Distribution not found");
    }

    return distribution;
  }

  static async getSignedDistributions(
    partnerId?: number
  ): Promise<SignedDistribution[]> {
    const where: Prisma.SignOffWhereInput = {};
    
    if (partnerId) {
      // Check if the partner is enabled
      const partner = await db.user.findUnique({
        where: { id: partnerId },
        select: { enabled: true },
      });
      
      if (!partner?.enabled) {
        return [];
      }
      
      where.partnerId = partnerId;
    }
    
    const signOffs = await db.signOff.findMany({
      where,
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
    const where: Prisma.DistributionWhereInput = {};
    
    if (partnerId) {
      // Check if the partner is enabled
      const partner = await db.user.findUnique({
        where: { id: partnerId },
        select: { enabled: true },
      });
      
      if (!partner?.enabled) {
        return [];
      }
      
      where.partner = { id: partnerId };
    } else {
      // Only include enabled partners when fetching all
      where.partner = { enabled: true };
    }
    
    const distributions = await db.distribution.findMany({
      where,
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

  static async getPendingDistributionForPartner(partnerId: number) {
    // Check if the partner is enabled
    const partner = await db.user.findUnique({
      where: { id: partnerId },
      select: { enabled: true },
    });
    
    if (!partner?.enabled) {
      return null;
    }
    
    return db.distribution.findFirst({
      where: { partnerId, pending: true },
    });
  }

  static async getCompletedSignOffs(
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<CompletedSignOffResponse> {
    const where = buildWhereFromFilters<Prisma.SignOffWhereInput>(
      Object.keys(Prisma.SignOffScalarFieldEnum),
      filters
    );

    const query = Prisma.validator<Prisma.SignOffFindManyArgs>()({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    buildQueryWithPagination(query, page, pageSize);

    const [signoffs, total] = await Promise.all([
      db.signOff.findMany(query),
      db.signOff.count({ where }),
    ]);

    type SignOffWithCount = Prisma.SignOffGetPayload<typeof query>;

    const mapped: CompletedSignOff[] = (signoffs as SignOffWithCount[]).map(
      (signoff) => ({
        partnerName: signoff.partnerName,
        staffMemberName: signoff.staffMemberName,
        date: signoff.date,
        createdAt: signoff.createdAt,
        allocationCount: signoff._count.allocations,
      })
    );

    return { signoffs: mapped, total };
  }

  static async getPartnerAllocationSummaries(
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<PartnerAllocationSummaryResponse> {
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

    const userFilterWhere = buildWhereFromFilters<Prisma.UserWhereInput>(
      Object.keys(Prisma.UserScalarFieldEnum),
      filters
    );

    const where: Prisma.UserWhereInput = {
      ...userFilterWhere,
      type: "PARTNER",
    };

    const usersQuery = Prisma.validator<Prisma.UserFindManyArgs>()({
      where,
      include: {
        allocations: true,
        _count: {
          select: {
            allocations: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    buildQueryWithPagination(usersQuery, page, pageSize);

    const [signOffsByPartnerId, usersWithAllocations, total] =
      await Promise.all([
        signOffsByPartnerIdPromise,
        db.user.findMany(usersQuery),
        db.user.count({ where }),
      ]);

    type UserWithAllocationCount = Prisma.UserGetPayload<typeof usersQuery>;

    const data: PartnerAllocationSummary[] = (
      usersWithAllocations as UserWithAllocationCount[]
    ).map((user) => {
      return {
        partnerId: user.id,
        partnerName: user.name,
        allocationsCount: user._count.allocations,
        pendingSignOffCount: signOffsByPartnerId[user.id] || 0,
      };
    });

    return { data, total };
  }

  static async createDistribution(
    data: Omit<Prisma.DistributionCreateInput, "partner" | "allocations"> & {
      partnerId: number;
      allocations?: {
        lineItemId: number;
        partnerId: number;
        signOffId?: number;
      }[];
    }
  ) {
    // Check if the partner is enabled
    const partner = await db.user.findUnique({
      where: { id: data.partnerId },
      select: { enabled: true, type: true },
    });
    
    if (!partner) {
      throw new NotFoundError("Partner not found");
    }
    
    if (!partner.enabled) {
      throw new ArgumentError("Cannot create distribution for deactivated partner");
    }
    
    return db.distribution.create({
      data: {
        ...data,
        partnerId: data.partnerId,
        allocations: {
          create: data.allocations ?? [],
        },
      },
      include: { allocations: true },
    });
  }

  static async updateDistribution(
    distributionId: number,
    data: { partnerId?: number; pending?: boolean }
  ) {
    // If partnerId is being updated, validate that the partner is enabled
    if (data.partnerId !== undefined) {
      const partner = await db.user.findUnique({
        where: { id: data.partnerId },
        select: { enabled: true },
      });

      if (!partner) {
        throw new NotFoundError("Partner not found");
      }

      if (!partner.enabled) {
        throw new ArgumentError("Cannot update distribution to deactivated partner");
      }
    }

    return db.distribution.update({
      where: { id: distributionId },
      data,
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

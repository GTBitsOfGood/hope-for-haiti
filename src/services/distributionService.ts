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
import { Prisma, ShipmentStatus } from "@prisma/client";
import { Filters } from "@/types/api/filter.types";
import { buildQueryWithPagination, buildWhereFromFilters } from "@/util/table";
import { hasShippingIdentifier, normalizeShippingTuple } from "@/util/shipping";

export default class DistributionService {
  static async getAllDistributions(
    page?: number,
    pageSize?: number,
    filters?: Filters
  ) {
    const whereClause = buildWhereFromFilters(
      Object.keys(Prisma.DistributionScalarFieldEnum),
      filters
    );

    // Handle boolean conversion for pending field if it comes as enum filter
    if (filters?.pending && filters.pending.type === "enum") {
      const pendingValues = filters.pending.values;
      if (pendingValues.length === 1) {
        // Convert string "true"/"false" to boolean
        const pendingBool = pendingValues[0] === "Pending";
        (whereClause as Record<string, unknown>).pending = {
          equals: pendingBool,
        };
      }
    }

    // similarly handle custmo filter logic for partner name 
    if (filters?.partnerName && filters.partnerName.type === "string") {
      (whereClause as Record<string, unknown>).partner = {
        name: {
          contains: filters.partnerName.value,
          mode: "insensitive",
        },
      };
    }

    const [distributions, totalCount] = await Promise.all([
      db.distribution.findMany({
        where: whereClause,
        include: {
          partner: true,
          allocations: {
            include: {
              lineItem: {
                include: {
                  generalItem: {
                    include: {
                      donorOffer: true,
                    },
                  },
                },
              },
            },
          },
        },
        take: pageSize,
        skip: page && pageSize ? (page - 1) * pageSize : undefined,
      }),
      db.distribution.count({
        where: whereClause,
      }),
    ]);

    // I tried doing the below with SQL, to no avail. No luck with Prisma either. There's no complex analytics here, so it should be fine.

    // Generate map of general items by their ID
    const generalItemsById: Record<
      number,
      (typeof distributions)[0]["allocations"][0]["lineItem"]["generalItem"]
    > = {};

    for (const distribution of distributions) {
      for (const allocation of distribution.allocations) {
        const generalItem = allocation.lineItem.generalItem;
        if (generalItem) {
          generalItemsById[generalItem.id] = generalItem;
        }
      }
    }

    // Group line items by their general item within each distribution
    const distributionsWithGroupedItems = distributions.map((distribution) => {
      const lineItems = distribution.allocations.map(
        (allocation) => allocation.lineItem
      );

      const generalItemsById: Record<
        number,
        (typeof distributions)[0]["allocations"][0]["lineItem"]["generalItem"] & {
          lineItems: Omit<
            (typeof distributions)[0]["allocations"][0]["lineItem"],
            "generalItem"
          >[];
        }
      > = {};

      // Add line items to their respective general items
      for (const lineItem of lineItems) {
        if (!lineItem.generalItem) continue;

        if (!generalItemsById[lineItem.generalItem.id]) {
          generalItemsById[lineItem.generalItem.id] = {
            ...lineItem.generalItem,
            lineItems: [],
          };
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { generalItem, ...lineItemWithoutGeneralItem } = lineItem;

        generalItemsById[lineItem.generalItem.id].lineItems.push(
          lineItemWithoutGeneralItem
        );
      }

      // Remove lineItem from allocations to avoid duplicating the data
      const allocationsWithoutLineItems = distribution.allocations.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ lineItem, ...allocation }) => allocation
      );

      return {
        ...distribution,
        allocations: allocationsWithoutLineItems,
        generalItems: Object.values(generalItemsById),
      };
    });

    return {
      data: distributionsWithGroupedItems,
      total: totalCount,
    };
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
      }
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
          pending: false,
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
        const nextSummary = {
          id: distribution.id,
          partnerId: distribution.partnerId,
          partnerName: distribution.partner.name,
          pending: distribution.pending,
        };

        const existing = acc[distribution.partnerId];
        if (!existing) {
          acc[distribution.partnerId] = nextSummary;
          return acc;
        }

        // Prefer pending distributions so new allocations always reuse the active record.
        if (!existing.pending && nextSummary.pending) {
          acc[distribution.partnerId] = nextSummary;
        }

        return acc;
      },
      {} as Record<
        number,
        {
          id: number;
          partnerId: number;
          partnerName: string;
          pending: boolean;
        }
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

  static async getPendingDistributions(params?: {
    term?: string;
    excludeIds?: number[];
  }) {
    const partnerWhere: Prisma.UserWhereInput = {
      enabled: true,
      pending: false,
    };

    // Add search filter if term is provided
    if (params?.term && params.term.trim().length > 0) {
      partnerWhere.name = {
        contains: params.term.trim(),
        mode: "insensitive",
      };
    }

    const where: Prisma.DistributionWhereInput = {
      pending: true,
      partner: partnerWhere,
    };

    // Exclude specific distribution IDs if provided
    if (params?.excludeIds && params.excludeIds.length > 0) {
      where.id = {
        notIn: params.excludeIds,
      };
    }

    const distributions = await db.distribution.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        partner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return distributions;
  }

  static async getSignedDistributions(
    partnerId?: number,
    page?: number,
    pageSize?: number,
    filters?: Filters
  ): Promise<SignedDistribution[]> {
    const whereClause = buildWhereFromFilters<Prisma.SignOffWhereInput>(
      Object.keys(Prisma.SignOffScalarFieldEnum),
      filters
    );

    const where: Prisma.SignOffWhereInput = whereClause;

    if (partnerId) {
      // Check if the partner is enabled and not pending
      const partner = await db.user.findUnique({
        where: { id: partnerId },
        select: { enabled: true, pending: true },
      });

      if (!partner?.enabled || partner?.pending) {
        return [];
      }

      where.partnerId = partnerId;
    }

    const signOffs = await db.signOff.findMany({
      where,
      include: { allocations: true },
      take: pageSize,
      skip: page && pageSize ? (page - 1) * pageSize : undefined,
    });

    return signOffs.map((signOff) => ({
      signOffId: signOff.id,
      distributionDate: format(signOff.createdAt, "yyyy-MM-dd"),
      numberOfItems: signOff.allocations.length,
    }));
  }

  static async getPartnerDistributionItems(
    partnerId?: number,
    page?: number,
    pageSize?: number,
    filters?: Filters
  ): Promise<DistributionItem[]> {
    const whereClause = buildWhereFromFilters<Prisma.DistributionWhereInput>(
      Object.keys(Prisma.DistributionScalarFieldEnum),
      filters
    );

    const where: Prisma.DistributionWhereInput = { ...whereClause };

    if (partnerId) {
      // Check if the partner is enabled and not pending
      const partner = await db.user.findUnique({
        where: { id: partnerId },
        select: { enabled: true, pending: true },
      });

      if (!partner?.enabled || partner?.pending) {
        return [];
      }

      where.partner = { id: partnerId };
    } else {
      // Only include enabled and non-pending partners when fetching all
      where.partner = { enabled: true, pending: false };
    }

    const distributions = await db.distribution.findMany({
      where,
      include: {
        allocations: true,
      },
      take: pageSize,
      skip: page && pageSize ? (page - 1) * pageSize : undefined,
    });

    const items: DistributionItem[] = [];

    for (const distribution of distributions) {
      for (const allocation of distribution.allocations) {
        const item = await db.lineItem.findUnique({
          where: { id: allocation.lineItemId },
        });

        if (!item)
          throw new NotFoundError(`Item ${allocation.lineItemId} not found`);

        const tuple = {
          donorShippingNumber: item?.donorShippingNumber,
          hfhShippingNumber: item?.hfhShippingNumber,
        };

        if (!hasShippingIdentifier(tuple)) {
          continue;
        }

        let shipmentStatus: ShipmentStatus =
          ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR;

        const normalizedTuple = normalizeShippingTuple(tuple); 

        const shippingStatus = await db.shippingStatus.findFirst({
          where: {
            hfhShippingNumber: normalizedTuple.hfhShippingNumber,
            donorShippingNumber: normalizedTuple.donorShippingNumber,
          },
        });

        if (shippingStatus) {
          shipmentStatus = shippingStatus.value;
        }

        items.push({
          ...item,
          shipmentStatus,
          quantityAllocated: item.quantity,
        });
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
    partnerId: number,
    page?: number,
    pageSize?: number,
    filters?: Filters
  ): Promise<PartnerDistributionsResult> {
    const distributionItemPromise = this.getPartnerDistributionItems(
      partnerId,
      page,
      pageSize,
      filters
    );
    const signedDistributionPromise = this.getSignedDistributions(
      partnerId,
      page,
      pageSize,
      filters
    );

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
    // Check if the partner is enabled and not pending
    const partner = await db.user.findUnique({
      where: { id: partnerId },
      select: { enabled: true, pending: true },
    });

    if (!partner?.enabled || partner?.pending) {
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
      enabled: true,
      pending: false,
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
    const partner = await db.user.findUnique({
      where: { id: data.partnerId },
      select: { enabled: true, pending: true, type: true },
    });

    if (!partner) {
      throw new NotFoundError("Partner not found");
    }

    if (!partner.enabled) {
      throw new ArgumentError(
        "Cannot create distribution for deactivated partner"
      );
    }

    if (partner.pending) {
      throw new ArgumentError("Cannot create distribution for pending partner");
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
    if (data.partnerId !== undefined) {
      const partner = await db.user.findUnique({
        where: { id: data.partnerId },
        select: { enabled: true, pending: true },
      });

      if (!partner) {
        throw new NotFoundError("Partner not found");
      }

      if (!partner.enabled) {
        throw new ArgumentError(
          "Cannot update distribution to deactivated partner"
        );
      }

      if (partner.pending) {
        throw new ArgumentError(
          "Cannot update distribution to pending partner"
        );
      }
    }

    const currentDistribution = await db.distribution.findUnique({
      where: { id: distributionId },
      select: { pending: true },
    });

    if (!currentDistribution) {
      throw new NotFoundError("Distribution not found");
    }

    if (data.pending === true && currentDistribution.pending === false) {
      const signedOffCount = await db.allocation.count({
        where: {distributionId, signOffId: { not: null} },
      });

      if (signedOffCount > 0) {
        throw new ArgumentError(
          "Cannot unapprove a distribution that has signed-off allocations."
        );
      }
    }

    const updatedDistribution = await db.distribution.update({
      where: { id: distributionId },
      data,
    });

    if (data.pending === false && currentDistribution.pending === true) {
      await this.createShipmentsForDistribution(distributionId);
    }

    return updatedDistribution;
  }

  private static async createShipmentsForDistribution(distributionId: number) {
    const allocations = await db.allocation.findMany({
      where: { distributionId },
      include: {
        lineItem: {
          select: {
            donorShippingNumber: true,
            hfhShippingNumber: true,
          },
        },
      },
    });

    const shippingTuples = new Map<
      string,
      { donorShippingNumber: string | null; hfhShippingNumber: string | null }
    >();

    for (const allocation of allocations) {
      const { donorShippingNumber, hfhShippingNumber } =
        allocation.lineItem;

      if (!donorShippingNumber && !hfhShippingNumber) {
        continue;
      }

      const key = `${donorShippingNumber || ""}|${hfhShippingNumber || ""}`;

      if (!shippingTuples.has(key)) {
        shippingTuples.set(key, {
          donorShippingNumber,
          hfhShippingNumber,
        });
      }
    }

    const shipmentPromises = Array.from(shippingTuples.values()).map(
      async (tuple) => {
        const where: Prisma.ShippingStatusWhereInput = {};

        if (tuple.donorShippingNumber !== null) {
          where.donorShippingNumber = tuple.donorShippingNumber;
        } else {
          where.donorShippingNumber = null;
        }

        if (tuple.hfhShippingNumber !== null) {
          where.hfhShippingNumber = tuple.hfhShippingNumber;
        } else {
          where.hfhShippingNumber = null;
        }

        const existingShipment = await db.shippingStatus.findFirst({
          where,
        });

        if (!existingShipment) {
          await db.shippingStatus.create({
            data: {
              donorShippingNumber: tuple.donorShippingNumber ?? undefined,
              hfhShippingNumber: tuple.hfhShippingNumber ?? undefined,
              value: ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR,
            },
          });
        }
      }
    );

    await Promise.all(shipmentPromises);
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

  /**
   * Generate Shipment & Partner Summary Report
   * Groups by shipment → recipient → category
   * Applies date range and/or shipment ID filters
   */
  static async getShipmentPartnerSummaryReport(payload: {
    startDate?: string;
    endDate?: string;
    shipmentId?: string;
  }) {
    console.log(
      "[DistributionService] getShipmentPartnerSummaryReport payload:",
      payload
    );

    const signOffs = await db.signOff.findMany({
      where: {
        ...(payload.startDate || payload.endDate
          ? {
              date: {
                ...(payload.startDate && {
                  gte: new Date(payload.startDate),
                }),
                ...(payload.endDate && {
                  lte: new Date(payload.endDate + "T23:59:59.999Z"),
                }),
              },
            }
          : {}),
      },
      include: {
        allocations: {
          include: {
            lineItem: {
              include: {
                generalItem: true,
              },
            },
          },
        },
      },
    });

    console.log(
      `[DistributionService] Found ${signOffs.length} sign-offs`
    );

    // Map to track shipment -> recipient -> category -> aggregated data
    const reportData = new Map<
      string,
      Map<
        string,
        Map<
          string | null,
          {
            shipmentNumber: string;
            recipient: string;
            category: string | null;
            totalItems: number;
            categoryValue: number;
          }
        >
      >
    >();

    // Track shipment totals for later
    const shipmentTotals = new Map<string, number>();

    for (const signOff of signOffs) {
      for (const allocation of signOff.allocations) {
        const lineItem = allocation.lineItem;
        const generalItem = lineItem.generalItem;

        const shipmentNumber = lineItem.hfhShippingNumber || "Unknown";

        // Apply shipment filter if provided
        if (payload.shipmentId && shipmentNumber !== payload.shipmentId) {
          continue;
        }

        const recipient = signOff.partnerName;
        const category = generalItem?.category || null;
        const itemValue = Number(lineItem.unitPrice) * lineItem.quantity;

        console.log(
          `[DistributionService] Processing: shipment=${shipmentNumber}, recipient=${recipient}, category=${category}, quantity=${lineItem.quantity}, value=${itemValue}`
        );

        // Initialize nested maps
        if (!reportData.has(shipmentNumber)) {
          reportData.set(shipmentNumber, new Map());
        }
        if (!reportData.get(shipmentNumber)!.has(recipient)) {
          reportData.get(shipmentNumber)!.set(recipient, new Map());
        }

        const categoryMap = reportData.get(shipmentNumber)!.get(recipient)!;
        const categoryKey = category || null;

        if (!categoryMap.has(categoryKey)) {
          categoryMap.set(categoryKey, {
            shipmentNumber,
            recipient,
            category: category || "Uncategorized",
            totalItems: 0,
            categoryValue: 0,
          });
        }

        const row = categoryMap.get(categoryKey)!;
        row.totalItems += lineItem.quantity;
        row.categoryValue += itemValue;

        // Track shipment total
        shipmentTotals.set(
          shipmentNumber,
          (shipmentTotals.get(shipmentNumber) || 0) + itemValue
        );
      }
    }

    // Flatten the nested map into a report array
    const report = [];
    for (const [shipmentNumber, recipients] of reportData) {
      const shipmentTotal = shipmentTotals.get(shipmentNumber) || 0;
      for (const [, categories] of recipients) {
        for (const [, row] of categories) {
          report.push({
            ...row,
            shipmentTotal,
          });
        }
      }
    }

    // Sort by shipment number, then recipient, then category
    report.sort((a, b) => {
      if (a.shipmentNumber !== b.shipmentNumber) {
        return a.shipmentNumber.localeCompare(b.shipmentNumber);
      }
      if (a.recipient !== b.recipient) {
        return a.recipient.localeCompare(b.recipient);
      }
      return (a.category || "").localeCompare(b.category || "");
    });

    console.log(
      `[DistributionService] Generated report with ${report.length} rows`
    );

    return {
      rows: report,
      fileName: `shipment-partner-summary-${format(new Date(), "yyyy-MM-dd")}.csv`,
    };
  }

  /**
   * Generate Donor & Category Summary Report
   * Groups by donor name → category
   * Applies date range and/or donor name filters
   */
  static async getDonorCategorySummaryReport(payload: {
    startDate?: string;
    endDate?: string;
    donorName?: string;
  }) {
    console.log(
      "[DistributionService] getDonorCategorySummaryReport payload:",
      payload
    );

    const signOffs = await db.signOff.findMany({
      where: {
        ...(payload.startDate || payload.endDate
          ? {
              date: {
                ...(payload.startDate && {
                  gte: new Date(payload.startDate),
                }),
                ...(payload.endDate && {
                  lte: new Date(payload.endDate + "T23:59:59.999Z"),
                }),
              },
            }
          : {}),
      },
      include: {
        allocations: {
          include: {
            lineItem: {
              include: {
                generalItem: true,
              },
            },
          },
        },
      },
    });

    console.log(
      `[DistributionService] Found ${signOffs.length} sign-offs`
    );

    // Map to track donor -> category -> aggregated data
    const reportData = new Map<
      string,
      Map<
        string | null,
        {
          donorName: string;
          category: string | null;
          totalQuantity: number;
          totalValueSent: number;
        }
      >
    >();

    for (const signOff of signOffs) {
      for (const allocation of signOff.allocations) {
        const lineItem = allocation.lineItem;
        const generalItem = lineItem.generalItem;

        const donor = lineItem.donorName;

        // Apply donor name filter if provided (case-insensitive partial match)
        if (
          payload.donorName &&
          !donor.toLowerCase().includes(payload.donorName.toLowerCase())
        ) {
          continue;
        }

        const category = generalItem?.category || null;
        const itemValue = Number(lineItem.unitPrice) * lineItem.quantity;

        console.log(
          `[DistributionService] Processing: donor=${donor}, category=${category}, quantity=${lineItem.quantity}, value=${itemValue}`
        );

        // Initialize nested maps
        if (!reportData.has(donor)) {
          reportData.set(donor, new Map());
        }

        const categoryMap = reportData.get(donor)!;
        const categoryKey = category || null;

        if (!categoryMap.has(categoryKey)) {
          categoryMap.set(categoryKey, {
            donorName: donor,
            category: category || "Uncategorized",
            totalQuantity: 0,
            totalValueSent: 0,
          });
        }

        const row = categoryMap.get(categoryKey)!;
        row.totalQuantity += lineItem.quantity;
        row.totalValueSent += itemValue;
      }
    }

    // Flatten the nested map into a report array
    const report = [];
    for (const [, categories] of reportData) {
      for (const [, row] of categories) {
        report.push(row);
      }
    }

    // Sort by donor name, then category
    report.sort((a, b) => {
      if (a.donorName !== b.donorName) {
        return a.donorName.localeCompare(b.donorName);
      }
      return (a.category || "").localeCompare(b.category || "");
    });

    console.log(
      `[DistributionService] Generated report with ${report.length} rows`
    );

    return {
      rows: report,
      fileName: `donor-category-summary-${format(new Date(), "yyyy-MM-dd")}.csv`,
    };
  }
}
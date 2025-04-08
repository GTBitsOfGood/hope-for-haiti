import { auth } from "@/auth";
import { db } from "@/db";
import {
  authenticationError,
  argumentError,
  authorizationError,
  notFoundError,
} from "@/util/responses";
import { ShipmentStatus, UserType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { AllocatedItem, DistributionItem } from "./types";
import { format } from "date-fns";
import { DistributionRecord } from "@/types";

const ALLOWED_USER_TYPES: UserType[] = [UserType.ADMIN, UserType.SUPER_ADMIN];

// const countAllocated = async (itemId: number) => {
//   const totalDonor = await db.donorOfferItemRequestAllocation.aggregate({
//     _sum: { quantity: true },
//     where: { itemId },
//   });

//   const totalUnallocated = await db.unallocatedItemRequestAllocation.aggregate({
//     _sum: { quantity: true },
//     where: { itemId },
//   });

//   return (
//     (totalDonor._sum.quantity ?? 0) + (totalUnallocated._sum.quantity ?? 0)
//   );
// };

const signedDistributions = async (partnerId: number) => {
  const signOffs = await db.signOff.findMany({
    where: { partnerId },
    include: { distributions: true },
  });

  return signOffs.map((signOff) => ({
    signOffId: signOff.id,
    distributionDate: format(signOff.createdAt, "yyyy-MM-dd"),
    numberOfItems: signOff.distributions.length,
  }));
};

const partnerDistributions = async (
  partnerId: number
): Promise<DistributionItem[]> => {
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

  // Combine items with same ID and sum their quantities
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
};

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return authenticationError("Session required");
  if (!session.user) return authenticationError("User not found");

  const user = session.user;

  if (user.type === UserType.PARTNER) {
    const partnerId = parseInt(user.id);
    try {
      const distributionItems = await partnerDistributions(partnerId);
      const signed = await signedDistributions(partnerId);

      const items: AllocatedItem[] = [];
      const unallocatedAllocations =
        await db.unallocatedItemRequestAllocation.findMany({
          where: {
            OR: [
              {
                visible: true,
                unallocatedItemRequest: { partnerId },
              },
              { visible: true, partnerId },
            ],
          },
          include: {
            unallocatedItem: true,
          },
        });
      unallocatedAllocations.map((alloc) => {
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

      const donorOfferAllocations =
        await db.donorOfferItemRequestAllocation.findMany({
          where: {
            visible: true,
            donorOfferItemRequest: {
              partnerId,
            },
          },
          include: {
            item: true,
          },
        });
      donorOfferAllocations.map((alloc) => {
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

      return NextResponse.json({
        items,
        distributionItems,
        signedDistributions: signed.sort(
          (a, b) =>
            new Date(b.distributionDate).getTime() -
            new Date(a.distributionDate).getTime()
        ),
      });
    } catch (err) {
      console.error("Partner distribution fetch error:", err);
      return notFoundError("Failed to fetch distributions");
    }
  }

  const visibleFilterStr = new URL(request.url).searchParams.get("visible");
  const visibleFilter = visibleFilterStr
    ? visibleFilterStr === "true"
      ? true
      : false
    : null;

  // Admin flow
  if (!ALLOWED_USER_TYPES.includes(user.type)) {
    return authorizationError("You are not allowed to view this");
  }

  const partnerUserId = request.nextUrl.searchParams.get("partnerId");
  if (!partnerUserId) return argumentError("Partner user ID is missing");

  const partnerIdNum = parseInt(partnerUserId);
  if (isNaN(partnerIdNum)) return argumentError("Invalid partner user ID");

  const partner = await db.user.findUnique({ where: { id: partnerIdNum } });
  if (!partner || partner.type !== UserType.PARTNER) {
    return argumentError("Partner not found");
  }

  const records: DistributionRecord[] = [];

  const baseWhere = visibleFilter !== null ? { visible: visibleFilter } : {};
  console.log(baseWhere);

  const unallocatedAllocations =
    await db.unallocatedItemRequestAllocation.findMany({
      where: {
        OR: [
          { ...baseWhere, unallocatedItemRequest: { partnerId: partnerIdNum } },
          { ...baseWhere, partnerId: partnerIdNum },
        ],
      },
      include: {
        unallocatedItem: true,
      },
    });
  unallocatedAllocations.map((alloc) => {
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
          partnerId: partnerIdNum,
        },
      },
      include: {
        item: true,
      },
    });
  donorOfferAllocations.map((alloc) => {
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

  return NextResponse.json({ records });
}

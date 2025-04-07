import { auth } from "@/auth";
import { db } from "@/db";
import {
  authenticationError,
  argumentError,
  authorizationError,
  notFoundError,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { DistributionItem } from "./types";
import { format } from "date-fns";

const ALLOWED_USER_TYPES: UserType[] = [UserType.ADMIN, UserType.SUPER_ADMIN];

const countAllocated = async (itemId: number) => {
  const totalDonor = await db.donorOfferItemRequestAllocation.aggregate({
    _sum: { quantity: true },
    where: { itemId },
  });

  const totalUnallocated = await db.unallocatedItemRequestAllocation.aggregate({
    _sum: { quantity: true },
    where: { itemId },
  });

  return (
    (totalDonor._sum.quantity ?? 0) + (totalUnallocated._sum.quantity ?? 0)
  );
};

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
    where: { partnerId, signOffId: null },
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

      return NextResponse.json({
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

  const distributions = await db.distribution.findMany({
    where: { partnerId: partnerIdNum },
    include: {
      unallocatedItemAllocation: { include: { unallocatedItem: true } },
      donorOfferItemAllocation: { include: { item: true } },
    },
  });

  const allItems = (
    await Promise.all(
      distributions.map(async (distribution) => {
        if (distribution.donorOfferItemAllocation) {
          const item = distribution.donorOfferItemAllocation.item;
          const allocated = await countAllocated(item.id);
          return {
            id: distribution.id,
            partnerId: distribution.partnerId,
            signOffId: distribution.signOffId,
            item,
            quantityAllocated: distribution.donorOfferItemAllocation.quantity,
            quantityAvailable: item.quantity - allocated,
            total: item.quantity,
            visible: distribution.donorOfferItemAllocation.visible,
          };
        } else if (distribution.unallocatedItemAllocation) {
          const item = distribution.unallocatedItemAllocation.unallocatedItem;
          const allocated = await countAllocated(item.id);
          return {
            id: distribution.id,
            partnerId: distribution.partnerId,
            signOffId: distribution.signOffId,
            item,
            quantityAllocated: distribution.unallocatedItemAllocation.quantity,
            quantityAvailable: item.quantity - allocated,
            total: item.quantity,
            visible: distribution.unallocatedItemAllocation.visible,
          };
        }
        return null;
      })
    )
  ).filter((item) => item !== null);

  return NextResponse.json({ items: allItems });
}

import { auth } from "@/auth";
import { db } from "@/db";
import {
  authenticationError,
  authorizationError,
  notFoundError,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  DistributionItem,
  PartnerDistributionsResponse,
  SignedDistributions,
} from "./types";
import { format } from "date-fns";

const signedDistributions = async (
  partnerId: number
): Promise<SignedDistributions[]> => {
  const signOffs = await db.signOff.findMany({
    where: { partnerId: partnerId },
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
    let allocation = null;

    if (distribution.unallocatedItemAllocation) {
      allocation = distribution.unallocatedItemAllocation;
    } else if (distribution.donorOfferItemAllocation) {
      allocation = distribution.donorOfferItemAllocation;
    }

    if (allocation) {
      const item = await db.item.findUnique({
        where: { id: allocation.itemId },
      });

      if (item && item.donorShippingNumber && item.hfhShippingNumber) {
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

  // Combine items with the same ID and sum their quantities
  const map = new Map<number, DistributionItem>();
  for (const item of items) {
    if (map.has(item.id)) {
      const existingItem = map.get(item.id);
      if (existingItem) {
        existingItem.quantityAllocated += item.quantityAllocated;
      }
    } else {
      map.set(item.id, item);
    }
  }

  return Array.from(map.values());
};

/**
 * Get distributions. For partners, will return distributions for the partner.
 *
 * @returns If user is a partner, will return the distirbutions for the partner as {distributionItems: DistributionItem[]}
 */
export async function GET() {
  const session = await auth();
  if (!session) {
    return authenticationError("Not authenticated");
  }
  if (!session.user) {
    return authorizationError("Not authorized");
  }

  if (session.user.type === UserType.PARTNER) {
    const partnerId = parseInt(session.user.id);

    try {
      const distributionItems = await partnerDistributions(partnerId);
      const signedDistributionsData = await signedDistributions(partnerId);

      return NextResponse.json({
        distributionItems,
        signedDistributions: signedDistributionsData.sort((a, b) => {
          return (
            new Date(b.distributionDate).getTime() -
            new Date(a.distributionDate).getTime()
          );
        }),
      } as PartnerDistributionsResponse);
    } catch (error) {
      console.error("Error fetching distributions:", error);
      return notFoundError("Failed to fetch distributions");
    }
  }

  return authorizationError(
    "Not authorized or functionality not implemented for this user role"
  );
}

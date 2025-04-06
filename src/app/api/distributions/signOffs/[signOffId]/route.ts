import { auth } from "@/auth";
import { db } from "@/db";
import { authenticationError, notFoundError } from "@/util/responses";
import { DistributionItem } from "./types";
import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";

/**
 * Gets the signed distributions for a given sign off ID.
 * @param _
 * @param param1
 * @returns
 */
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ signOffId: string }> }
) {
  const session = await auth();
  if (!session) {
    return authenticationError("User not authenticated");
  }
  if (!session.user) {
    return authenticationError("User not authenticated");
  }

  const signOffId = parseInt((await params).signOffId);
  const signOff = await db.signOff.findUnique({
    where: { id: signOffId },
    include: { distributions: true },
  });
  if (!signOff) {
    return notFoundError("Sign off not found");
  }

  const items: DistributionItem[] = [];
  for (const distribution of signOff.distributions) {
    let item = null;
    let quantityAllocated = null;
    if (distribution.unallocatedItemRequestAllocationId) {
      const allocation = await db.unallocatedItemRequestAllocation.findUnique({
        where: { id: distribution.unallocatedItemRequestAllocationId },
        include: { unallocatedItem: true },
      });
      item = allocation?.unallocatedItem;
      quantityAllocated = allocation?.quantity;

      // console.log(allocation?.quantity);

      if (item && quantityAllocated !== undefined)
        items.push({
          ...item,
          quantityAllocated: quantityAllocated,
        });
    }
    if (distribution.donorOfferItemRequestAllocationId) {
      const allocation = await db.donorOfferItemRequestAllocation.findUnique({
        where: { id: distribution.donorOfferItemRequestAllocationId },
        include: { item: true },
      });
      item = allocation?.item;
      quantityAllocated = allocation?.quantity;

      if (item && quantityAllocated !== undefined)
        items.push({
          ...item,
          quantityAllocated: quantityAllocated,
        });
    }
  }

  return NextResponse.json({
    itemDistributions: items,
    signOff: {
      date: format(signOff.date, "MM/dd/yyyy"),
    },
  });
}

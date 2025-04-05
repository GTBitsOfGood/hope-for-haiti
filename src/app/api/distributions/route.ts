import { auth } from "@/auth";
import { db } from "@/db";
import {
  authenticationError,
  argumentError,
  authorizationError,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { DistributionItem } from "./types";

const ALLOWED_USER_TYPES: UserType[] = [UserType.ADMIN, UserType.SUPER_ADMIN];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return authenticationError("Session required");

  if (!session?.user) {
    return authenticationError("User not found");
  }

  if (!ALLOWED_USER_TYPES.includes(session.user.type))
    return authorizationError("You are not allowed to view this");

  const params = request.nextUrl.searchParams;
  const partnerUserId = params.get("partnerId");
  if (partnerUserId == null) {
    return argumentError("Partner user ID is missing");
  }
  const partnerIdNum = parseInt(partnerUserId);
  if (isNaN(partnerIdNum)) {
    return argumentError("Invalid partner user ID");
  }

  const partner = await db.user.findUnique({
    where: {
      id: partnerIdNum,
    },
  });

  if (partner == null || partner.type !== UserType.PARTNER) {
    return argumentError("Partner not found");
  }

  const distributions = await db.distribution.findMany({
    where: {
      partnerId: partnerIdNum,
    },
    include: {
      unallocatedItemAllocation: {
        include: {
          unallocatedItem: true,
        },
      },
      donorOfferItemAllocation: {
        include: {
          item: true,
        },
      },
    },
  });

  const countAllocated = async (itemId: number) => {
    const totalDonor = await db.donorOfferItemRequestAllocation.aggregate({
      _sum: {
        quantity: true,
      },
      where: {
        itemId,
      },
    });
    const totalUnallocated =
      await db.unallocatedItemRequestAllocation.aggregate({
        _sum: {
          quantity: true,
        },
        where: {
          itemId,
        },
      });
    return (
      (totalDonor._sum.quantity ?? 0) + (totalUnallocated._sum.quantity ?? 0)
    );
  };

  const allItems: DistributionItem[] = (
    await Promise.all(
      distributions.map(async (distribution) => {
        if (distribution.donorOfferItemAllocation !== null) {
          const item = distribution.donorOfferItemAllocation.item;
          const allocated = await countAllocated(item.id);
          return [
            {
              id: distribution.id,
              partnerId: distribution.partnerId,
              signOffId: distribution.signOffId,
              item: distribution.donorOfferItemAllocation.item,
              quantityAllocated: distribution.donorOfferItemAllocation.quantity,
              quantityAvailable: item.quantity - allocated,
              total: item.quantity,
              visible: distribution.donorOfferItemAllocation.visible,
            },
          ];
        } else if (distribution.unallocatedItemAllocation !== null) {
          const item = distribution.unallocatedItemAllocation.unallocatedItem;
          const allocated = await countAllocated(item.id);
          return [
            {
              id: distribution.id,
              partnerId: distribution.partnerId,
              signOffId: distribution.signOffId,
              item: distribution.unallocatedItemAllocation.unallocatedItem,
              quantityAllocated:
                distribution.unallocatedItemAllocation.quantity,
              quantityAvailable: item.quantity - allocated,
              total: item.quantity,
              visible: distribution.unallocatedItemAllocation.visible,
            },
          ];
        }
        return [];
      }),
    )
  ).flat();

  return NextResponse.json({
    items: allItems,
  });
}

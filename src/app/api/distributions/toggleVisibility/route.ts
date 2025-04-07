import { auth } from "@/auth";
import { db } from "@/db";
import {
  authenticationError,
  authorizationError,
  argumentError,
  ok,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextRequest } from "next/server";

const AUTHORIZED_USER_TYPES = [
  UserType.ADMIN,
  UserType.SUPER_ADMIN,
] as UserType[];

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");
  if (!AUTHORIZED_USER_TYPES.includes(session.user.type)) {
    return authorizationError("Unauthorized");
  }

  const url = new URL(request.url);
  const visible = (url.searchParams.get("visible") || "") === "true";

  const allocTypeStr = url.searchParams.get("allocType");
  const idStr = url.searchParams.get("id");
  if (allocTypeStr && idStr) {
    const id = parseInt(idStr);
    if (Number.isNaN(id)) return argumentError("Invalid ID");

    if (allocTypeStr === "unallocated") {
      await db.unallocatedItemRequestAllocation.update({
        where: {
          id,
        },
        data: { visible },
      });
    } else if (allocTypeStr === "donorOffer") {
      await db.donorOfferItemRequestAllocation.update({
        where: {
          id,
        },
        data: { visible },
      });
    } else {
      return argumentError("invalid allocation type");
    }

    return ok();
  }

  const partnerIdStr = url.searchParams.get("partnerId") || "";
  const partnerId = parseInt(partnerIdStr);
  if (Number.isNaN(partnerId)) return argumentError("Invalid partner ID");
  await db.$transaction(async (tx) => {
    await tx.unallocatedItemRequestAllocation.updateMany({
      where: { OR: [{ partnerId }, { unallocatedItemRequest: { partnerId } }] },
      data: { visible },
    });
    await tx.donorOfferItemRequestAllocation.updateMany({
      where: { donorOfferItemRequest: { partnerId } },
      data: { visible },
    });
  });

  return ok();
}

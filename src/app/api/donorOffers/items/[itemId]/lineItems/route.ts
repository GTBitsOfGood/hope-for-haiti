import { auth } from "@/auth";
import { db } from "@/db";
import { authenticationError, authorizationError } from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");
  if (
    session.user.type !== UserType.ADMIN &&
    session.user.type !== UserType.SUPER_ADMIN &&
    session.user.type !== UserType.STAFF
  ) {
    return authorizationError("Unauthorized user type");
  }

  const donorOfferItemId = parseInt((await params).itemId);

  const donorOfferItem = await db.donorOfferItem.findUnique({
    where: {
      id: donorOfferItemId,
    },
    select: {
      items: true,
    },
  });

  return Response.json(donorOfferItem?.items ?? []);
}

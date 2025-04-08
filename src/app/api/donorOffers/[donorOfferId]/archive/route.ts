import { auth } from "@/auth";
import { db } from "@/db";
import { authenticationError, authorizationError, ok } from "@/util/responses";
import { DonorOfferState, UserType } from "@prisma/client";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
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

  const donorOfferId = parseInt((await params).donorOfferId);
  await db.donorOffer.update({
    where: { id: donorOfferId },
    data: { state: DonorOfferState.ARCHIVED },
  });

  return ok();
}

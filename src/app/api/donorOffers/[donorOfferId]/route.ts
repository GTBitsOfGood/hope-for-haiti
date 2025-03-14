import { auth } from "@/auth";
import { db } from "@/db";
import {
  authenticationError,
  authorizationError,
  notFoundError,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { DateTime } from "next-auth/providers/kakao";
import { NextRequest, NextResponse } from "next/server";

interface DonorOfferItem {
  title: string;
  type: string;
  expiration?: DateTime;
  quantity: number;
  unitSize: string;
}

/**
 *
 * @param _ Not needed, place holder
 * @param param1 donorOfferId: string, the dynamic route parameter
 * @returns 401 if session is invalid
 * @returns 403 if session is not a partner
 * @returns 404 if donor offer does not exist
 * @returns 200 with the donor offer items. Look at DonorOfferItem for the structure.
 */
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  const session = await auth();
  if (!session) return authenticationError("Session required");
  if (!session?.user) return authenticationError("Session required");
  if (session.user.type !== UserType.PARTNER)
    return authorizationError("Wrong user type");

  const donorOfferId = parseInt((await params).donorOfferId);
  const donorOffer = await db.donorOffer.findUnique({
    where: { id: donorOfferId },
  });
  if (!donorOffer) return notFoundError("Donor offer not found");

  const donorOfferItems = (
    await db.donorOfferItem.findMany({
      where: { donorOfferId: donorOfferId },
    })
  ).map((item) => ({
    title: item.title,
    type: item.type,
    expiration: item.expiration,
    quantity: item.quantity,
    unitSize: item.unitSize,
  }));

  return NextResponse.json(donorOfferItems as unknown as DonorOfferItem[]);
}

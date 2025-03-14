import { auth } from "@/auth";
import { db } from "@/db";
import { authenticationError, authorizationError } from "@/util/responses";
import { DonorOfferState, UserType } from "@prisma/client";
import { DateTime } from "next-auth/providers/kakao";
import { NextResponse } from "next/server";

interface DonorOffer {
  donorOffer: string;
  donorName: string;
  responseDeadline: DateTime;
  status: DonorOfferState;
}

/**
 * Gets all donor offers.
 * @returns 401 if session is invalid
 * @returns 403 if session is not a partner
 * @returns 200 with the donor offers. Look at DonorOffer for the structure.
 */
export async function GET() {
  const session = await auth();
  if (!session) return authenticationError("Session required");
  if (!session?.user) return authenticationError("Session required");
  if (session.user.type !== UserType.PARTNER)
    return authorizationError("Wrong user type");

  const donorOffers = await db.donorOffer.findMany();
  const formattedDonorOffers = donorOffers.map((offer) => ({
    offerName: offer.offerName,
    donorName: offer.donorName,
    responseDeadline: offer.responseDeadline,
    state: offer.state,
  }));

  return NextResponse.json(formattedDonorOffers as unknown as DonorOffer[]);
}

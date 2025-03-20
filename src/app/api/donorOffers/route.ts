import { auth } from "@/auth";
import { db } from "@/db";
import { authenticationError, authorizationError } from "@/util/responses";
import { DonorOfferState, UserType } from "@prisma/client";
import { DateTime } from "next-auth/providers/kakao";
import { NextResponse } from "next/server";
import { format } from "date-fns";

interface DonorOffer {
  donorOfferId: number;
  offerName: string;
  donorName: string;
  responseDeadline: DateTime;
  state: DonorOfferState;
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
  const formattedDonorOffers = donorOffers.map(
    (offer) =>
      ({
        donorOfferId: offer.id,
        offerName: offer.offerName,
        donorName: offer.donorName,
        responseDeadline: format(offer.responseDeadline, "MM/dd/yyyy"),
        state: offer.state,
      }) as DonorOffer
  );

  return NextResponse.json(formattedDonorOffers as DonorOffer[]);
}

import { auth } from "@/auth";
import { db } from "@/db";
import { authenticationError, authorizationError } from "@/util/responses";
import { DonorOfferState, UserType } from "@prisma/client";
import { isAfter } from "date-fns";
import { NextResponse } from "next/server";

/**
 * Gets all donor offers based on user type.
 * @returns 401 if session is invalid
 * @returns 403 if user type is not allowed
 * @returns 200 with the donor offers.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");

  if (session.user.type === UserType.PARTNER) {
    return await getPartnerDonorOffers(parseInt(session.user.id));
  } else if (
    session.user.type === UserType.ADMIN ||
    session.user.type === UserType.SUPER_ADMIN ||
    session.user.type === UserType.STAFF
  ) {
    return await getAdminDonorOffers();
  } else {
    return authorizationError("Unauthorized user type");
  }
}

async function getPartnerDonorOffers(partnerId: number) {
  const donorOffers = await db.donorOffer.findMany({
    where: {
      partnerVisibilities: {
        some: {
          partnerId,
        },
      },
    },
    include: {
      items: {
        include: {
          requests: {
            where: {
              partnerId: partnerId,
            },
          },
        },
      },
    },
  });

  const formattedDonorOffers = donorOffers.map((offer) => {
    let state = null;

    if (
      offer.state === DonorOfferState.ARCHIVED ||
      isAfter(new Date(), offer.partnerResponseDeadline)
    ) {
      state = "closed";
    }

    const requestSubmitted = offer.items.some(
      (item) => item.requests.length > 0
    );

    if (requestSubmitted) {
      state = "submitted";
    } else {
      state = "pending";
    }
    return {
      donorOfferId: offer.id,
      offerName: offer.offerName,
      donorName: offer.donorName,
      responseDeadline: offer.partnerResponseDeadline,
      state: state,
    };
  });

  return NextResponse.json(formattedDonorOffers);
}

async function getAdminDonorOffers() {
  const donorOffers = await db.donorOffer.findMany({
    include: {
      partnerVisibilities: {
        include: {
          partner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      items: {
        include: {
          requests: {
            select: {
              partnerId: true,
            },
          },
        },
      },
    },
  });

  const formattedDonorOffers = donorOffers.map((offer) => ({
    donorOfferId: offer.id,
    offerName: offer.offerName,
    donorName: offer.donorName,
    responseDeadline: offer.partnerResponseDeadline,
    state: offer.state,
    invitedPartners: offer.partnerVisibilities.map((pv) => ({
      name: pv.partner.name,
      responded: offer.items.some((item) =>
        item.requests.some((request) => request.partnerId === pv.partnerId)
      ),
    })),
  }));
  return NextResponse.json(formattedDonorOffers);
}

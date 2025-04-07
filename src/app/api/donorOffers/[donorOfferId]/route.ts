import { auth } from "@/auth";
import { db } from "@/db";
import {
  authenticationError,
  authorizationError,
  notFoundError,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { format } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import {
  DonorOfferItemDTO,
  DonorOfferItemsRequestsDTO,
  DonorOfferItemsRequestsResponse,
} from "./types";

async function handlePartnerRequest(
  donorOfferId: number
): Promise<NextResponse> {
  const donorOffer = await db.donorOffer.findUnique({
    where: { id: donorOfferId },
  });
  if (!donorOffer) return notFoundError("Donor offer not found");

  const donorOfferItems = (
    await db.donorOfferItem.findMany({
      where: { donorOfferId: donorOfferId },
    })
  ).map(
    (item) =>
      ({
        id: item.id,
        title: item.title,
        type: item.type,
        expiration:
          item.expirationDate === null
            ? null
            : format(item.expirationDate, "MM/dd/yyyy"),
        quantity: item.quantity,
        unitSize: item.quantityPerUnit,
      }) as DonorOfferItemDTO
  );

  const donorOfferItemsRequests: DonorOfferItemsRequestsDTO[] = [];
  for (const item of donorOfferItems) {
    donorOfferItemsRequests.push(
      ...(
        await db.donorOfferItemRequest.findMany({
          where: { donorOfferItemId: item.id },
        })
      ).map((request) => ({
        requestId: request.id,
        title: item.title,
        type: item.type,
        expiration: item.expiration,
        quantity: item.quantity,
        unitSize: item.unitSize,
        quantityRequested: request.quantity,
        comments: request.comments,
        priority: request.priority,
      }))
    );
  }

  return NextResponse.json({
    donorOfferName: donorOffer.offerName,
    donorOfferItemsRequests: donorOfferItemsRequests,
  } as DonorOfferItemsRequestsResponse);
}

async function handleAdminRequest(donorOfferId: number): Promise<NextResponse> {
  const donorOffer = await db.donorOffer.findUnique({
    where: { id: donorOfferId },
  });

  if (!donorOffer) return notFoundError("Donor offer not found");

  const itemsWithRequests = await db.donorOfferItem.findMany({
    where: {
      donorOfferId: donorOfferId,
    },
    include: {
      requests: {
        include: {
          partner: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    donorOffer: donorOffer,
    itemsWithRequests: itemsWithRequests,
  });
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");

  const donorOfferId = parseInt((await params).donorOfferId);

  if (session.user.type === UserType.PARTNER) {
    return handlePartnerRequest(donorOfferId);
  } else if (
    session.user.type === UserType.ADMIN ||
    session.user.type === UserType.SUPER_ADMIN ||
    session.user.type === UserType.STAFF
  ) {
    return handleAdminRequest(donorOfferId);
  } else {
    return authorizationError("Unauthorized user type");
  }
}

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

/**
 * Gets the item requests under the donor offer's id from the dynamic parameter.
 * First gets the donor offer from the database, then gets the items under the donor offer, then gets the requests under each item.
 * @param _ Not needed, place holder
 * @param param1 donorOfferId: string, the dynamic route parameter
 * @returns 401 if session is invalid
 * @returns 403 if session is not a partner
 * @returns 404 if donor offer does not exist
 * @returns 200 with the donor offer items. Look at DonorOfferItemsRequestsResponse for the structure.
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
  ).map(
    (item) =>
      ({
        id: item.id,
        title: item.title,
        type: item.type,
        expiration:
          item.expiration === null
            ? null
            : format(item.expiration, "MM/dd/yyyy"),
        quantity: item.quantity,
        unitSize: item.unitSize,
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

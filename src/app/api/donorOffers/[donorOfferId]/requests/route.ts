import { auth } from "@/auth";
import { db } from "@/db";
import { GeneralItem } from "@/types";
import { authenticationError, authorizationError, ok } from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextRequest } from "next/server";

type GeneralItemRequest = GeneralItem & {
  quantity: number;
  expirationDate: string;
};

interface RequestBody {
  requests: GeneralItemRequest[];
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return authenticationError("Session required");
  }
  if (
    session.user.type !== UserType.STAFF &&
    session.user.type !== UserType.ADMIN &&
    session.user.type !== UserType.SUPER_ADMIN
  ) {
    return authorizationError("Unauthorized");
  }

  const data: RequestBody = await req.json();

  const donorOfferId = parseInt((await params).donorOfferId);

  await db.$transaction(async (tx) => {
    await Promise.all(
      data.requests.map((itemRequest) => {
        tx.donorOfferItem
          .findFirst({
            where: {
              donorOfferId: donorOfferId,
              title: itemRequest.title,
              type: itemRequest.type,
              expirationDate: new Date(itemRequest.expirationDate),
              unitType: itemRequest.unitType,
              quantityPerUnit: itemRequest.quantityPerUnit || 0,
            },
          })
          .then((donorOfferItem) => {
            if (!donorOfferItem)
              throw "Couldn't find matching donor offer item";

            tx.donorOfferItem.update({
              where: {
                id: donorOfferItem.id,
              },
              data: {
                requestQuantity: itemRequest.quantity,
              },
            });
          });
      })
    );
  });

  return ok();
}

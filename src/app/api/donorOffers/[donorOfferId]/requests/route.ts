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
      data.requests.map((itemRequest) =>
        tx.donorOfferItem.update({
          where: {
            donorOfferId_title_type_expirationDate_unitType_quantityPerUnit: {
              donorOfferId: donorOfferId,
              title: itemRequest.title,
              type: itemRequest.type,
              expirationDate: new Date(itemRequest.expirationDate),
              unitType: itemRequest.unitType,
              quantityPerUnit: itemRequest.quantityPerUnit || 0,
            },
          },
          data: {
            requestQuantity: itemRequest.quantity,
          },
        })
      )
    );
  });

  return ok();
}

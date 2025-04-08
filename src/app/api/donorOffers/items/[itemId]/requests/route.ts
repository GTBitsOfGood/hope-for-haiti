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

  const itemId = parseInt((await params).itemId);

  const requests = await db.donorOfferItemRequest.findMany({
    where: { donorOfferItemId: itemId },
    include: {
      donorOfferItem: true,
      partner: {
        select: {
          name: true,
        },
      },
    },
  });

  const allocations = await Promise.all(
    requests.map(async (request) => {
      return await db.donorOfferItemRequestAllocation.findMany({
        where: {
          donorOfferItemRequestId: request.id,
        },
        include: {
          item: true,
        },
      });
    })
  );

  return Response.json(
    requests.map((request, index) => ({
      ...request,
      allocations: allocations[index],
    }))
  );
}

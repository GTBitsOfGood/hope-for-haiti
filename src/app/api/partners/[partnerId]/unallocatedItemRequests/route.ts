import { auth } from "@/auth";
import { db } from "@/db";
import {
  argumentError,
  authenticationError,
  authorizationError,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextResponse } from "next/server";

interface UnallocatedItemRequestsResponse {
  unallocatedItemRequests: {
    id: number;
    itemId: number;
    quantity: number;
    comments: string;
  }[];
}

/**
 * Handles GET requests to retrieve unallocated item requests that relate to a partner id.
 * @param req - the incoming request (unused)
 * @param params - the partner id to retrieve unallocated item requests for
 * @returns 401 if the session is invalid
 * @returns 403 if the user type isn't staff, admin, or super admin
 * @returns 400 if the partner id is not an integer
 * @returns 200 and a json response with the unallocated item requests associated with the partnerId
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const session = await auth();
  if (!session) return authenticationError("Session required");
  if (!session?.user) return authenticationError("User not found");
  if (
    session.user.type !== UserType.STAFF &&
    session.user.type !== UserType.ADMIN &&
    session.user.type !== UserType.SUPER_ADMIN
  )
    return authorizationError("Unauthorized");

  const partnerId = parseInt((await params).partnerId);
  if (isNaN(partnerId)) return argumentError("Partner Id must be an integer");

  const unallocatedItemRequests = await db.unallocatedItemRequest.findMany({
    where: { partnerId },
    select: {
      id: true,
      itemId: true,
      quantity: true,
      comments: true,
    },
  });

  return NextResponse.json({
    unallocatedItemRequests,
  } as UnallocatedItemRequestsResponse);
}

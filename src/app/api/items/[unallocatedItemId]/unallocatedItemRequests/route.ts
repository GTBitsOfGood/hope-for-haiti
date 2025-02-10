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
    partnerId: number;
    quantity: number;
    comments: string;
  }[];
}

/**
 * Handles GET requests to retrieve unallocated item requests that relate to an item id.
 * @param request - the incoming request (unused)
 * @param params - the item id to retrieve unallocated item requests for
 * @returns 401 if the session is invalid
 * @returns 403 if the user type isn't staff, admin, or super admin
 * @returns 400 if the item id is not an integer
 * @returns 200 and a json response with the unallocated item requests
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ unallocatedItemId: string }> }
) {
  // Validate session
  const session = await auth();
  if (!session) return authenticationError("Session required");
  if (!session?.user) return authenticationError("User not found");
  if (
    session.user.type !== UserType.STAFF &&
    session.user.type !== UserType.ADMIN &&
    session.user.type !== UserType.SUPER_ADMIN
  )
    return authorizationError("Unauthorized");

  // Get item id from request parameters
  const itemId = parseInt((await params).unallocatedItemId);
  if (isNaN(itemId)) return argumentError("Item Id must be an integer");

  // Get all unallocated item requests for the specified item
  const unallocatedItemRequests = await db.unallocatedItemRequest.findMany({
    where: { itemId },
    select: {
      id: true,
      partnerId: true,
      quantity: true,
      comments: true,
    },
  });

  return NextResponse.json({
    unallocatedItemRequests,
  } as UnallocatedItemRequestsResponse);
}

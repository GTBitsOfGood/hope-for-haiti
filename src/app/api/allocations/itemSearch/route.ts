import { auth } from "@/auth";
import { db } from "@/db";
import {
  argumentError,
  authenticationError,
  authorizationError,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

interface UnallocatedItemRequestsResponse {
  unallocatedItemRequests: Array<{
    id: number;
    partnerId: number;
    quantity: number;
    comments: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ unallocatedItemId: string }> },
): Promise<NextResponse> {
  const { unallocatedItemId } = await params;

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

  const itemId = parseInt(unallocatedItemId, 10);
  if (isNaN(itemId)) {
    return argumentError("Item ID must be an integer");
  }

  const unallocatedItemRequests = await db.unallocatedItemRequest.findMany({
    select: {
      id: true,
      partnerId: true,
      quantity: true,
      comments: true,
    },
  });

  const responseBody: UnallocatedItemRequestsResponse = {
    unallocatedItemRequests,
  };
  return NextResponse.json(responseBody);
}

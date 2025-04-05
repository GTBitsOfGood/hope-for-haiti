import { auth } from "@/auth";
import {
  authenticationError,
  authorizationError,
  notFoundError,
} from "@/util/responses";
import { NextRequest, NextResponse } from "next/server";
import { UserType } from "@prisma/client";
import { db } from "@/db";

const AUTHORIZED_USER_TYPES = [
  UserType.STAFF,
  UserType.ADMIN,
  UserType.SUPER_ADMIN,
] as UserType[];

/**
 * Retrieves details for a specific partner by ID.
 * @returns 401 if the request is not authenticated
 * @returns 403 if the user is not STAFF, ADMIN, or SUPER_ADMIN
 * @returns 404 if the partner is not found
 * @returns 200 and the partner details if successful
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
): Promise<NextResponse> {
  const { partnerId } = await params;
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");
  if (!AUTHORIZED_USER_TYPES.includes(session.user.type)) {
    return authorizationError("You are not allowed to view this");
  }

  const partnerIdInt = parseInt(partnerId);
  if (isNaN(partnerIdInt)) {
    return notFoundError("Invalid partner ID");
  }

  const partner = await db.user.findFirst({
    where: {
      id: partnerIdInt,
      type: UserType.PARTNER,
    },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: { unallocatedItemRequests: true },
      },
    },
  });

  if (!partner) {
    return notFoundError("Partner not found");
  }

  return NextResponse.json({
    id: partner.id,
    name: partner.name,
    email: partner.email,
    unallocatedItemRequestCount: partner._count.unallocatedItemRequests,
  });
}

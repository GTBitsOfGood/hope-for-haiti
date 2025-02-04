import {
  authenticationError,
  notFoundError,
  authorizationError,
} from "@/util/responses";
import { auth } from "@/auth";
import { db } from "@/db";
import { NextResponse, NextRequest } from "next/server";
import { OrganizationType, UserType } from "@prisma/client";

interface PartnerDetails {
  numberOfPatients: number;
  organizationType: OrganizationType;
}

/**
 * Retrieves the current user's partner details from the partnerDetails database.
 * Parameters are passed via dynamic route segments.
 * @params userId: ID of the user to fetch partner details for
 * @returns 401 if the request is not authenticated
 * @returns 403 if the user is not authorized to view the partner details
 * @returns 404 if the partner details with the given ID were not found
 * @returns 200
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  const { userId } = await params;
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");
  if (session.user.type === UserType.PARTNER && session.user.id !== userId) {
    return authorizationError("You are not allowed to view this");
  }

  const partnerDetails: PartnerDetails | null =
    await db.partnerDetails.findUnique({
      where: { userId: parseInt(userId) },
      select: { numberOfPatients: true, organizationType: true },
    });
  if (!partnerDetails) return notFoundError("Partner details not found");
  return NextResponse.json(partnerDetails);
}

import {
  authenticationError,
  notFoundError,
  authorizationError,
  argumentError,
} from "@/util/responses";
import { auth } from "@/auth";
import { db } from "@/db";
import { NextResponse, NextRequest } from "next/server";
import { OrganizationType, UserType } from "@prisma/client";

import { z } from "zod";
import { zfd } from "zod-form-data";

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

// Zod schema
const PartnerDetailsFormSchema = zfd.formData({
  numberOfPatients: zfd.numeric(
    z.number().min(1, "Number of patients must be positive")
  ),
  organizationType: zfd.text(z.enum(["NON_PROFIT", "FOR_PROFIT", "RELIGIOUS"])),
});

/**
 * Updates a user's partner details.
 * Parameters are passed as form data.
 *
 * @param numberOfPatients The number of patients associated with the partner
 * @param organizationType The type of the organization (NON_PROFIT, FOR_PROFIT, RELIGIOUS)
 * @param userId The ID of the user whose partner details are being updated
 *
 * @returns 401 if the request is not authenticated
 * @returns 403 if a PARTNER user attempts to modify another user's details
 * @returns 404 if no PartnerDetails record is found
 * @returns 200 with the updated partner details
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // authenticate the user session
  const session = await auth();
  if (!session?.user) {
    return authenticationError("Session required");
  }
  const { user } = session;

  // await params and ensure params.userId exists
  const { userId } = await params;
  if (!userId) {
    return argumentError("Missing user ID parameter");
  }

  // partner users can only modify their own details
  if (user.type === "PARTNER" && user.id !== userId) {
    return authorizationError("You are not allowed to modify this record");
  }

  // parse FormData
  const formData = await req.formData();
  const parsedData = PartnerDetailsFormSchema.safeParse(formData);
  if (!parsedData.success) {
    return argumentError("Invalid form data");
  }

  // update PartnerDetails record
  const userIdNumber = Number(userId); //db schema accepts a number
  const updatedUser = await db.user.update({
    where: { id: userIdNumber },
    data: {
      partnerDetails: parsedData.data
    }
  });

  return NextResponse.json(updatedUser.partnerDetails);
}

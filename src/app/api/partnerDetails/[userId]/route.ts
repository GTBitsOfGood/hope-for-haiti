import { authenticationError, notFoundError, authorizationError, argumentError } from "@/util/responses";
import { auth } from "@/auth";
import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { zfd } from "zod-form-data"; // <-- Added import from zod-form-data
import { PrismaClient } from "@prisma/client"; 

// new Prisma Client
const prisma = new PrismaClient();

// Zod schema
const PartnerDetailsFormSchema = zfd.formData({
  numberOfPatients: zfd.numeric(z.number().min(1, "Number of patients must be positive")),
  organizationType: zfd.text(z.enum(["NON_PROFIT", "FOR_PROFIT", "RELIGIOUS"])),
});

/**
 * Updates a user's partner details.
 * Accepts parameters as FormData.
 *
 * @param {NextRequest} req The incoming request object.
 * @param {Object} context The route parameters containing the user ID.
 *
 * @returns {NextResponse} 401 if request is not authenticated.
 * @returns {NextResponse} 403 if the session user is a PARTNER modifying another user's details.
 * @returns {NextResponse} 400 if the request body is invalid.
 * @returns {NextResponse} 404 if no PartnerDetails record is found.
 * @returns {NextResponse} 200 with the updated partner details.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // authenticate the user session
    const session = await auth();
    if (!session || !session.user) {
      return authenticationError("Session required");
    }
    const { user } = session;

    // await params and ensure params.userId exists
    const { userId } = await params;
    if (!userId) {
      console.error("Missing user ID parameter in request");
      return argumentError("Missing user ID parameter");
    }

    const userIdNumber = parseInt(userId, 10);
    if (isNaN(userIdNumber)) {
      console.error("Invalid user ID parameter");
      return argumentError("Invalid user ID");
    }

    // partner users can only modify their own details
    if (user.type === "PARTNER" && String(user.id) !== String(userIdNumber)) {
      return authorizationError("You are not allowed to modify this record");
    }

    // parse FormData
    const formData = await req.formData();
    const parsedData = PartnerDetailsFormSchema.safeParse(formData);
    if (!parsedData.success) {
      console.error("Invalid form data:", parsedData.error);
      return argumentError("Invalid form data");
    }

    const { numberOfPatients, organizationType } = parsedData.data;

    // check if partnerDetails exists
    const partnerDetails = await prisma.partnerDetails.findUnique({
      where: { userId: userIdNumber },
    });
    if (!partnerDetails) {
      console.error("Partner details not found for user ID:", userIdNumber);
      return notFoundError("Partner details not found");
    }

    // update PartnerDetails record
    const updatedPartnerDetails = await prisma.partnerDetails.update({
      where: { userId: userIdNumber },
      data: {
        numberOfPatients,
        organizationType,
      },
    });

    return NextResponse.json(updatedPartnerDetails, { status: 200 });
  } catch (error) {
    console.error("Error updating PartnerDetails:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

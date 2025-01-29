import { authenticationError, notFoundError, authorizationError, argumentError } from "@/util/responses";
import { auth } from "@/auth";
import { db } from "@/db";
import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { UserType, OrganizationType } from "@prisma/client";

// Zod schema for JSON data validation
const PartnerDetailsSchema = z.object({
  numberOfPatients: z.number().min(1, "Number of patients must be positive"),
  organizationType: z.nativeEnum(OrganizationType),
});

/**
 * Updates a user's partner details.
 * Accepts data as JSON or FormData.
 *
 * @param {NextRequest} req - The incoming request object.
 * @param {Object} context - The route parameters containing the user ID.
 *
 * @returns {NextResponse} 401 if request is not authenticated.
 * @returns {NextResponse} 403 if the session user is a PARTNER modifying another user's details.
 * @returns {NextResponse} 400 if the request body is invalid.
 * @returns {NextResponse} 404 if no PartnerDetails record is found.
 * @returns {NextResponse} 200 with the updated partner details.
 */
export async function POST(req: NextRequest, context: { params: { userId: string } }) {
  try {
    // authenticate the user session
    const session = await auth();
    if (!session || !session.user) return authenticationError("Session required");

    const { user } = session;

    // ensure `params` and `userId` exist
    if (!context.params || !context.params.userId) {
      console.error("Missing user ID parameter in request");
      return argumentError("Missing user ID parameter");
    }

    const userId = parseInt(context.params.userId, 10);
    if (isNaN(userId)) {
      console.error("Invalid user ID parameter");
      return argumentError("Invalid user ID");
    }

    // partner users can only modify their own details
    if (user.type === UserType.PARTNER && String(user.id) !== String(userId)) {
      return authorizationError("You are not allowed to modify this record");
    }

    let bodyData: {};

    // check if form data (html) or json and parse for both
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      bodyData = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      bodyData = Object.fromEntries(formData.entries());
    } else {
      return argumentError("Unsupported data type");
    }

    // validate request
    const parsedData = PartnerDetailsSchema.safeParse(bodyData);
    if (!parsedData.success) {
      console.error("Invalid form data:", parsedData.error);
      return argumentError("Invalid form data");
    }

    const { numberOfPatients, organizationType } = parsedData.data;

    // see if partnerDetails exists
    const partnerDetails = await db.partnerDetails.findUnique({ where: { userId } });
    if (!partnerDetails) {
      console.error("Partner details not found for user ID:", userId);
      return notFoundError("Partner details not found");
    }

    // update PartnerDetails record
    const updatedPartnerDetails = await db.partnerDetails.update({
      where: { userId },
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

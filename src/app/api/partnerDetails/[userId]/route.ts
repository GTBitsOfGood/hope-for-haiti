import { authenticationError, notFoundError, authorizationError } from "@/util/responses";
import { auth } from "@/auth";
import { db } from "@/db";
import { NextResponse, NextRequest} from "next/server";
import { UserType } from "@prisma/client";

/**
 * Handles GET requests to retrieve the current user's partner details from the partnerDetails database.
 * @param {NextRequest} request - The incoming request object.
 * @param {Object} params - The route parameters object containing the user ID.
 *
 * @returns {NextResponse} On success, returns a status of 200 and a JSON object containing the current user's partner details.
 * @returns {NextResponse} On authentication error, returns a status of 401 and a JSON object containing an error message.
 * @returns {NextResponse} On authorization error, returns a status of 403 and a JSON object containing an error message.
 * @returns {NextResponse} If record with given ID was not found, returns a status of 404 and a JSON object containing an error message.
 * 
 * @example
 * // Example response:
 * {
 *   "numberOfPatients": 10,
 *   "organizationType": "NON_PROFIT"
 * }
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const session = await auth();
    if (!session) return authenticationError("Session required");
    if (session.user.type === UserType.PARTNER && session.user.id !== userId) {
        return authorizationError("You are not allowed to view this");
    }

    const partnerDetails = await db.partnerDetails.findUnique({
        where:{ userId: parseInt(userId), },
    });
    if (!partnerDetails) return notFoundError("Partner details not found");

    const { numberOfPatients, organizationType } = partnerDetails;
    return NextResponse.json({ numberOfPatients, organizationType }, { status: 200 });
}
// import { NextRequest } from 'next/server';
import { auth } from "@/auth";
import { authenticationError } from "@/util/responses";
import { db } from "@/db";
import { NextResponse } from "next/server";

// Response for GET /api/unclaimedItems
interface UnclaimedItemsResponse {
  unclaimedItems: {
    id: number;
    name: string;
    quantity: number;
    expirationDate: Date | null;
  }[];
}

/**
 * Handles GET requests to retrieve unclaimed items from the unclaimedItem database.
 * @returns 401 if the session is invalid
 * @returns 500 if an unknown error occurs
 * @returns 200 and a json response with the unclaimed items
 */
export async function GET() {
  const session = await auth();
  if (!session) return authenticationError("Session required");

  if (!session?.user) {
    return authenticationError("User not found");
  }

  // Get all unclaimed items
  const unclaimedItems = await db.unclaimedItem.findMany();

  return NextResponse.json({
    unclaimedItems: unclaimedItems,
  } as UnclaimedItemsResponse);
}

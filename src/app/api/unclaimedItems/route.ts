// import { NextRequest } from 'next/server';
import { auth } from "@/auth";
import { authenticationError, argumentError } from "@/util/responses";
import { db } from "@/db";
import { NextRequest, NextResponse } from "next/server";

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
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return authenticationError("Session required");

  if (!session?.user) {
    return authenticationError("User not found");
  }

  const params = request.nextUrl.searchParams;
  const expirationDateBefore = params.has("expirationDateBefore")
    ? new Date(params.get("expirationDateBefore") as string)
    : undefined;
  const expirationDateAfter = params.has("expirationDateAfter")
    ? new Date(params.get("expirationDateAfter") as string)
    : undefined;

  if (
    expirationDateBefore &&
    expirationDateBefore.toISOString() !== params.get("expirationDateBefore")
  ) {
    return argumentError(
      "expirationDateBefore is not a valid ISO-8601 timestamp"
    );
  }

  if (
    expirationDateAfter &&
    expirationDateAfter.toISOString() !== params.get("expirationDateAfter")
  ) {
    return argumentError(
      "expirationDateAfter is not a valid ISO-8601 timestamp"
    );
  }

  // Get all unclaimed items
  const unclaimedItems = await db.unclaimedItem.findMany({
    where: {
      expirationDate: {
        gt: expirationDateAfter,
        lt: expirationDateBefore,
      },
    },
  });

  return NextResponse.json({
    unclaimedItems: unclaimedItems,
  } as UnclaimedItemsResponse);
}

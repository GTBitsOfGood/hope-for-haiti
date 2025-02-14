import { auth } from "@/auth";
import { authenticationError, argumentError } from "@/util/responses";
import { db } from "@/db";
import { NextRequest, NextResponse } from "next/server";

// Response for GET /api/unclaimedItems
interface ItemsResponse {
  items: {
    id: number;
    title: string;
    category: string;
    quantity: number;
    expirationDate: Date | null;
    unitSize: number;
    unitType: string;
    datePosted: Date;
    lotNumber: number;
    donorName: string;
    unitPrice: number;
    maxRequestLimit: string;
  }[];
}

/**
 *
 * @params dateString
 * @returns the parsed date string or null if the date string is invalid
 */
function parseDate(dateString: string): Date | null {
  // see https://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
  const date = new Date(dateString);
  if (
    Object.prototype.toString.call(date) === "[object Date]" &&
    !isNaN(date.getTime())
  ) {
    return new Date(dateString);
  }
  return null;
}

/**
 * Handles GET requests to retrieve unclaimed items from the unclaimedItem database.
 * Parameters are passed in the URL query string.
 * @params expirationDateBefore: ISO-8601 timestamp that returned items expire before
 * @params expirationDateAfter: ISO-8601 timestamp that returned items expire after
 * @returns 401 if the session is invalid
 * @returns 400 if expirationDateAfter or expirationDateBefore are invalid ISO-8601 timestamps
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
    ? parseDate(params.get("expirationDateBefore") as string)
    : undefined;
  const expirationDateAfter = params.has("expirationDateAfter")
    ? parseDate(params.get("expirationDateAfter") as string)
    : undefined;

  if (expirationDateBefore === null) {
    return argumentError(
      "expirationDateBefore must be a valid ISO-8601 timestamp"
    );
  }

  if (expirationDateAfter === null) {
    return argumentError(
      "expirationDateAfter must be a valid ISO-8601 timestamp"
    );
  }

  // Get all unclaimed items that expire after expirationDateAfter and before expirationDateBefore
  const items = await db.item.findMany({
    where: {
      expirationDate: {
        gt: expirationDateAfter,
        lt: expirationDateBefore,
      },
    },
  });

  return NextResponse.json({
    items: items,
  } as ItemsResponse);
}

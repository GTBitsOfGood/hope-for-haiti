import { auth } from "@/auth";
import { authenticationError, argumentError } from "@/util/responses";
import { db } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { Item } from "@prisma/client";

// Response for GET /api/unclaimedItems
interface ItemsResponse {
  items: Item[];
}

/**
 * Takes a date string, validates it, and parses it into a Date object.
 * @params dateString: the date string to parse
 * @returns undefined if the date string is undefined/null
 * @returns null if the date string is defined but invalid
 * @returns a Date object if the date string is valid
 */
function parseDateIfDefined(
  dateString: string | null
): Date | null | undefined {
  // see https://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
  if (!dateString) {
    return undefined;
  }
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
  const expirationDateBefore = parseDateIfDefined(
    params.get("expirationDateBefore")
  );
  const expirationDateAfter = parseDateIfDefined(
    params.get("expirationDateAfter")
  );

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

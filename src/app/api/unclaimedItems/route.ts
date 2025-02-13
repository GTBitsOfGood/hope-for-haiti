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

  // Get all unclaimed items
  console.log(expirationDateBefore, expirationDateAfter);
  const unclaimedItems = await db.unclaimedItem.findMany({
    where: {
      expirationDate: {
        gt: expirationDateAfter,
        lt: expirationDateBefore,
      },
    },
  });

  console.log(unclaimedItems);

  return NextResponse.json({
    unclaimedItems: unclaimedItems,
  } as UnclaimedItemsResponse);
}

/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth } from "@/auth";
import { db } from "@/db";
import {
  argumentError,
  authenticationError,
  authorizationError,
  ok,
} from "@/util/responses";
import { RequestPriority, UserType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zfd } from "zod-form-data";

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
 * Handles GET requests to retrieve unallocated items from the items table.
 * Parameters are passed in the URL query string.
 * @params expirationDateBefore: ISO-8601 timestamp that returned items expire before
 * @params expirationDateAfter: ISO-8601 timestamp that returned items expire after
 * @returns 401 if the session is invalid
 * @returns 400 if expirationDateAfter or expirationDateBefore are invalid ISO-8601 timestamps
 * @returns 200 and a json response with the unallocated items
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

  const scopeVisibility =
    session.user.type === UserType.PARTNER ? { visible: true } : {};

  // Get all unclaimed items that expire after expirationDateAfter and before expirationDateBefore
  const items = (
    await db.item.groupBy({
      by: ["title", "type", "expirationDate", "unitType", "unitSize"],
      _sum: {
        quantity: true,
      },
      where: {
        expirationDate: {
          gt: expirationDateAfter,
          lt: expirationDateBefore,
        },
        ...scopeVisibility,
      },
    })
  ).map((item) => {
    const copy = {
      ...item,
      quantity: item._sum.quantity,
      _sum: undefined,
    };
    delete copy._sum;
    return copy;
  });

  return NextResponse.json({
    items,
  });
}

const schema = zfd.formData({
  title: zfd.text(),
  type: zfd.text(),
  priority: zfd.text(z.nativeEnum(RequestPriority)),
  expirationDate: z.coerce.date().optional(),
  unitSize: zfd.numeric(z.number().int()),
  quantity: zfd.numeric(z.number().int().min(1)), // Requesting 0 items would be stupid
  comments: zfd.text(),
});

/**
 * Handles POST requests to create a new unallocated item request.
 * Uses form data unallocatedItemId, quantity, and comment.
 * @param req - the incoming request
 * @returns 200 if the request is successful
 * @returns 400 if the form data is invalid or there are not enough items for the request
 * @returns 401 if the session is invalid
 * @returns 403 if the user type isn't a partner
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return authenticationError("Session required");
  if (!session?.user) return authenticationError("User not found");
  if (session.user.type !== UserType.PARTNER)
    return authorizationError("Unauthorized");

  const parsed = schema.safeParse(await req.formData());
  if (!parsed.success) return argumentError("Invalid form data");
  const {
    title,
    type,
    priority,
    expirationDate,
    unitSize,
    quantity,
    comments,
  } = parsed.data;

  db.unallocatedItemRequest.create({
    data: {
      title,
      type,
      priority,
      expirationDate,
      unitSize,
      quantity,
      comments,
      partnerId: parseInt(session.user.id),
    },
  });

  return ok();
}

/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth } from "@/auth";
import { db } from "@/db";
import {
  argumentError,
  authenticationError,
  authorizationError,
  ok,
} from "@/util/responses";
import { parseDateIfDefined } from "@/util/util";
import { RequestPriority, UserType } from "@prisma/client";
import { format } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zfd } from "zod-form-data";

/**
 * Handles GET requests to retrieve unallocated items from the items table. For the flow, also returns a list of unit types, donors, and item types.
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
  const tableItems = (
    await db.item.groupBy({
      by: ["title", "type", "expirationDate", "unitType", "quantityPerUnit"],
      _sum: {
        quantity: true,
      },
      where: {
        ...scopeVisibility,
        ...(expirationDateAfter && !expirationDateBefore
          ? {
              OR: [
                { expirationDate: { gt: expirationDateAfter } },
                { expirationDate: null },
              ],
            }
          : {
              expirationDate: {
                ...(expirationDateAfter && { gt: expirationDateAfter }),
                ...(expirationDateBefore && { lt: expirationDateBefore }),
              },
            }),
      },
    })
  ).map((item) => {
    const copy = {
      ...item,
      quantity: item._sum.quantity,
      expirationDate: item.expirationDate?.toISOString(),
      _sum: undefined,
    };
    delete copy._sum;
    return copy;
  });

  const unitTypesSet = new Set<string>();
  const donorNamesSet = new Set<string>();
  const itemTypesSet = new Set<string>();
  const items = await db.item.findMany();
  items.forEach((item) => {
    if (item.unitType) unitTypesSet.add(item.unitType);
    donorNamesSet.add(item.donorName);
    itemTypesSet.add(item.type);
  });

  return NextResponse.json({
    items: tableItems,
    unitTypes: Array.from(unitTypesSet).sort(),
    donorNames: Array.from(donorNamesSet).sort(),
    itemTypes: Array.from(itemTypesSet).sort(),
  });
}

const schema = zfd.formData({
  title: zfd.text(),
  type: zfd.text(),
  priority: zfd.text(z.nativeEnum(RequestPriority)),
  expirationDate: z.coerce.date().optional(),
  unitType: zfd.text(),
  quantityPerUnit: zfd.numeric(z.number().int()),
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
    unitType,
    quantityPerUnit,
    quantity,
    comments,
  } = parsed.data;

  db.unallocatedItemRequest.create({
    data: {
      title,
      type,
      priority,
      expirationDate,
      unitType,
      quantityPerUnit,
      quantity,
      comments,
      partnerId: parseInt(session.user.id),
    },
  });

  return ok();
}

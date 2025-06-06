import { auth } from "@/auth";
import { db } from "@/db";
import {
  authenticationError,
  authorizationError,
  argumentError,
} from "@/util/responses";
import { parseDateIfDefined } from "@/util/util";
import { UserType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const paramSchema = z.object({
  title: z.string(),
  type: z.string(),
  expirationDate: z.string().nullable(), // some items have undefined expiration
  unitType: z.string(),
  quantityPerUnit: z.string(),
});

/**
 * Handles GET requests to retrieve unallocated line items.
 * @param request - the incoming request (unused)
 * @param params - the item id to retrieve unallocated item requests for
 * @returns 400 if the search params are missing or invalid
 * @returns 401 if the session is invalid
 * @returns 403 if the user type isn't staff, admin, or super admin
 * @returns 200 and a json response with the items
 */
export async function GET(request: NextRequest) {
  // Validate session
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");
  if (
    session.user.type !== UserType.STAFF &&
    session.user.type !== UserType.ADMIN &&
    session.user.type !== UserType.SUPER_ADMIN
  )
    return authorizationError("Unauthorized");

  const params = request.nextUrl.searchParams;

  const parsed = paramSchema.safeParse({
    title: params.get("title"),
    type: params.get("type"),
    expirationDate: params.get("expirationDate"),
    unitType: params.get("unitType"),
    quantityPerUnit: params.get("quantityPerUnit"),
  });

  if (!parsed.success) {
    return argumentError("Invalid search parameters");
  }

  let expirationDate: Date | null;
  if (parsed.data.expirationDate) {
    expirationDate = parseDateIfDefined(parsed.data.expirationDate) ?? null;
    if (expirationDate === null) {
      return argumentError("Expiration must be a valid ISO-8601 timestamp");
    }
  } else {
    expirationDate = null;
  }

  const quantityPerUnit = parseInt(parsed.data.quantityPerUnit);
  if (isNaN(quantityPerUnit)) {
    return argumentError("Quantity per unit must be an integer");
  }

  // Get all unallocated item requests for the specified item
  const items = await db.item.findMany({
    where: {
      title: parsed.data.title,
      type: parsed.data.type,
      expirationDate: expirationDate ?? null,
      unitType: parsed.data.unitType,
      quantityPerUnit,
    },
  });

  return NextResponse.json({
    items,
  });
}

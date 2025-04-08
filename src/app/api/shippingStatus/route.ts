import {
  argumentError,
  authenticationError,
  authorizationError,
  ok,
} from "@/util/responses";
import { db } from "@/db";
import { auth } from "@/auth";
import { UserType, Item, ShippingStatus, ShipmentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_USER_TYPES: UserType[] = [
  UserType.ADMIN,
  UserType.STAFF,
  UserType.SUPER_ADMIN,
];

/**
 * Handles GET requests to retrieve unallocated items from the items table.
 * Parameters are passed in the URL query string.
 * @params expirationDateBefore: ISO-8601 timestamp that returned items expire before
 * @params expirationDateAfter: ISO-8601 timestamp that returned items expire after
 * @returns 401 if the session is invalid
 * @returns 400 if expirationDateAfter or expirationDateBefore are invalid ISO-8601 timestamps
 * @returns 200 and a json response with the unallocated items
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return authenticationError("Session required");
  }

  if (!ALLOWED_USER_TYPES.includes(session.user.type)) {
    return authorizationError("You are not authorized to access this resource");
  }

  const shippingNumberPairs = await db.item.findMany({
    where: {
      donorShippingNumber: { not: null },
      hfhShippingNumber: { not: null },
    },
    distinct: ["donorShippingNumber", "hfhShippingNumber"],
  });

  const itemMap: Item[][] = [];
  const statuses: ShippingStatus[] = [];
  let i = 0;
  for (const pair of shippingNumberPairs) {
    const donorShippingNumber = pair.donorShippingNumber as string;
    const hfhShippingNumber = pair.hfhShippingNumber as string;
    const status = await db.shippingStatus.findFirst({
      where: {
        donorShippingNumber: donorShippingNumber,
        hfhShippingNumber: hfhShippingNumber,
      },
    });
    if (status) {
      statuses.push({ ...status, id: i });
    } else {
      statuses.push({
        id: i,
        donorShippingNumber: donorShippingNumber,
        hfhShippingNumber: hfhShippingNumber,
        value: "WAITING_ARRIVAL_FROM_DONOR",
      });
    }

    const items = await db.item.findMany({
      where: {
        donorShippingNumber: donorShippingNumber,
        hfhShippingNumber: hfhShippingNumber,
      },
    });
    itemMap.push(items);
    i++;
  }

  return NextResponse.json({
    shippingStatuses: statuses,
    items: itemMap,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return authenticationError("Session required");
  }
  if (
    session.user.type !== UserType.STAFF &&
    session.user.type !== UserType.ADMIN &&
    session.user.type !== UserType.SUPER_ADMIN
  ) {
    return authorizationError("Unauthorized");
  }

  const url = new URL(req.url);
  const donorShippingNumber = url.searchParams.get("donorShippingNumber");
  const hfhShippingNumber = url.searchParams.get("hfhShippingNumber");
  const valueStr = url.searchParams.get("value");

  if (!donorShippingNumber || !hfhShippingNumber || !valueStr) {
    return argumentError(
      "Must set donorShippingNumber, hfhShippingNumber, and value params"
    );
  }

  if (!Object.keys(ShipmentStatus).includes(valueStr)) {
    return argumentError(
      `Value must be one of: ${Object.keys(ShipmentStatus).join(", ")}`
    );
  }

  const value = valueStr as ShipmentStatus;

  await db.shippingStatus.upsert({
    where: {
      donorShippingNumber_hfhShippingNumber: {
        donorShippingNumber,
        hfhShippingNumber,
      },
    },
    update: {
      value,
    },
    create: {
      donorShippingNumber,
      hfhShippingNumber,
      value,
    },
  });

  return ok();
}

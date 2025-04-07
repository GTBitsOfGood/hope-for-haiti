import { auth } from "@/auth";
import { db } from "@/db";
import {
  argumentError,
  authenticationError,
  authorizationError,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { UnallocatedItem } from "./types";

/**
 * Handles GET requests to fetch unallocated item requests. For the flow, also returns the items with an extra attribute quantity left.
 * Requires query params title, type, expiration, and unitSize.
 * @param req - the incoming request
 * @returns 200 with all requests and their allocations
 * @returns 400 if the query parameters are invalid
 * @returns 401 if the session is invalid
 * @returns 403 if the user is not staff, admin, or super-admin
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return authenticationError("Session required");
  if (!session?.user) return authenticationError("User not found");

  if (
    session.user.type !== UserType.STAFF &&
    session.user.type !== UserType.ADMIN &&
    session.user.type !== UserType.SUPER_ADMIN
  ) {
    return authorizationError("Unauthorized");
  }

  const url = new URL(req.url);
  const title = url.searchParams.get("title");
  const type = url.searchParams.get("type");
  const expirationDateParam = url.searchParams.get("expirationDate");
  const unitType = url.searchParams.get("unitType");
  const quantityPerUnitParam = url.searchParams.get("quantityPerUnit");
  if (!title || !type || !unitType || !quantityPerUnitParam) {
    return argumentError("Missing required query parameters");
  }
  const quantityPerUnit = parseInt(quantityPerUnitParam);
  if (isNaN(quantityPerUnit)) {
    return argumentError("Invalid quantityPerUnitParam parameter");
  }

  const expirationDate = expirationDateParam
    ? new Date(expirationDateParam)
    : null;
  if (expirationDate && isNaN(expirationDate.getTime())) {
    return argumentError("Invalid expiration parameter");
  }

  try {
    const requests = await db.unallocatedItemRequest.findMany({
      where: {
        title: title,
        type: type,
        expirationDate: expirationDate,
        unitType: unitType,
        quantityPerUnit: quantityPerUnit,
      },
      include: {
        partner: {
          select: {
            name: true,
          },
        },
      },
    });

    const allocations = await Promise.all(
      requests.map(async (request) => {
        return await db.unallocatedItemRequestAllocation.findMany({
          where: {
            unallocatedItemRequestId: request.id,
          },
          include: {
            unallocatedItem: true,
          },
        });
      })
    );

    const items = await db.item.findMany({
      where: {
        title: title,
        type: type,
        expirationDate: expirationDate,
        unitType: unitType,
        quantityPerUnit: quantityPerUnit,
      },
    });
    const modifiedItems: UnallocatedItem[] = await Promise.all(
      items.map(async (item) => {
        const quantityAllocated =
          await db.unallocatedItemRequestAllocation.aggregate({
            _sum: {
              quantity: true,
            },
            where: {
              itemId: item.id,
            },
          });
        return {
          ...item,
          quantityLeft: item.quantity - (quantityAllocated._sum.quantity || 0),
        };
      })
    );

    return NextResponse.json({
      requests: requests.map((request, index) => ({
        ...request,
        allocations: allocations[index],
      })),
      items: modifiedItems,
    });
  } catch (error) {
    console.error("Error fetching unallocated item requests:", error);
    return argumentError("Failed to fetch unallocated item requests");
  }
}

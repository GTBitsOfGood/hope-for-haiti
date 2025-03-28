import { auth } from "@/auth";
import { db } from "@/db";
import {
  argumentError,
  authenticationError,
  authorizationError,
} from "@/util/responses";
import { UserType } from "@prisma/client";

/**
 * Handles GET requests to fetch unallocated item requests.
 * Requires query params title, type, expiration, and unitSize.
 * @param req - the incoming request
 * @returns 200 with all requests and their allocations
 * @returns 400 if the query parameters are invalid
 * @returns 401 if the session is invalid
 * @returns 403 if the user is not staff, admin, or super-admin
 */
export async function GET(req: Request) {
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
  const expiration = url.searchParams.get("expiration");
  const unitSizeParam = url.searchParams.get("unitSize");
  if (!title || !type || !expiration || unitSizeParam === null) {
    return argumentError("Missing required query parameters");
  }
  const unitSize = parseInt(unitSizeParam);
  if (isNaN(unitSize)) {
    return argumentError("Invalid unitSize parameter");
  }
  const expirationDate = new Date(expiration);
  if (isNaN(expirationDate.getTime())) {
    return argumentError("Invalid expiration parameter");
  }

  try {
    const requests = await db.unallocatedItemRequest.findMany({
      where: {
        title: title,
        type: type,
        expirationDate: expirationDate,
        unitSize: unitSize,
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
    return Response.json(
      requests.map((request, index) => ({
        ...request,
        allocations: allocations[index],
      }))
    );
  } catch (error) {
    console.error("Error fetching unallocated item requests:", error);
    return argumentError("Failed to fetch unallocated item requests");
  }
}

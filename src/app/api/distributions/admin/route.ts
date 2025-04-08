import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { authenticationError, authorizationError } from "@/util/responses";
import { UserType } from "@prisma/client";

/**
 * GET: Retrieves signoffs based on the completed query parameter
 *
 * @param request The incoming HTTP request with query parameters
 * @returns 401 if session is invalid
 * @returns 403 if user is not authorized
 * @returns 200 with signoffs data if successful
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return authenticationError("Session required");
  }

  // Only allow staff, admin, and super admin to access this endpoint
  if (
    session.user.type !== UserType.STAFF &&
    session.user.type !== UserType.ADMIN &&
    session.user.type !== UserType.SUPER_ADMIN
  ) {
    return authorizationError("Unauthorized");
  }

  const url = new URL(request.url);
  const completed = url.searchParams.get("completed");

  // If completed=true, return signoffs with distribution counts
  if (completed === "true") {
    const signoffs = await db.signOff.findMany({
      select: {
        partnerName: true,
        staffMemberName: true,
        date: true,
        createdAt: true,
        _count: {
          select: {
            distributions: true,
          },
        },
      },
    });

    return NextResponse.json({ signoffs });
  }

  const usersWithAllocations = await db.user.findMany({
    where: {
      type: "PARTNER",
    },
    include: {
      unallocatedItemRequests: {
        include: {
          allocations: true,
        },
      },
      donorOfferItemRequests: {
        include: {
          DonorOfferItemRequestAllocation: true,
        },
      },
      unallocatedItemRequestAllocations: true,
      distributions: true,
      _count: {
        select: {
          distributions: {
            where: {
              signOff: {
                signatureUrl: null,
              },
            },
          },
        },
      },
    },
  });

  const partnerAllocationsWithVisibility = usersWithAllocations.map((user) => {
    const unallocatedRequestAllocations = user.unallocatedItemRequests.flatMap(
      (request) => request.allocations || []
    );

    const donorOfferRequestAllocations = user.donorOfferItemRequests.flatMap(
      (request) => request.DonorOfferItemRequestAllocation || []
    );

    const allAllocations = [
      ...user.unallocatedItemRequestAllocations,
      ...unallocatedRequestAllocations,
      ...donorOfferRequestAllocations,
    ];

    const visibleAllocations = allAllocations.filter(
      (allocation) => allocation.visible
    );
    const hiddenAllocations = allAllocations.filter(
      (allocation) => !allocation.visible
    );

    return {
      partnerId: user.id,
      partnerName: user.name,
      visibleAllocationsCount: visibleAllocations.length,
      hiddenAllocationsCount: hiddenAllocations.length,
      pendingSignOffCount: user._count.distributions,
    };
  });

  return NextResponse.json({ data: partnerAllocationsWithVisibility });
}

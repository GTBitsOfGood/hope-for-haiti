import { auth } from "@/auth";
import AllocationService from "@/services/allocationService";
import DistributionService from "@/services/distributionService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const postSchema = z.object({
  partnerId: z.number().int().positive(),
  allocations: z.array(z.number().int().positive()),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Admin access required");
    }

    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    let distribution =
      await DistributionService.getPendingDistributionForPartner(
        parsed.data.partnerId
      );
    if (!distribution) {
      distribution = await DistributionService.createDistribution({
        partnerId: parsed.data.partnerId,
        pending: true,
      });
    }

    let failureCount = 0;
    const errorMessages: string[] = [];

    const allocationPromises = parsed.data.allocations.map((allocationId) =>
      AllocationService.createAllocation({
        itemId: allocationId,
        partnerId: parsed.data.partnerId,
        distributionId: distribution!.id,
      }).catch((error) => {
        failureCount++;
        errorMessages.push(error.message);
      })
    );

    const allocations = await Promise.all(allocationPromises);

    if (failureCount === parsed.data.allocations.length) {
      await DistributionService.deleteDistribution(distribution.id);
      throw new Error("All allocations failed: " + errorMessages.join("; "));
    }

    return NextResponse.json({ allocations, distribution }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

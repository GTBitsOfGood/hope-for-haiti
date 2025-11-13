import { auth } from "@/auth";
import AllocationService from "@/services/allocationService";
import DistributionService from "@/services/distributionService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const postSchema = z.object({
  partnerId: z.number().int().positive(),
  lineItem: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "allocationWrite");

    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    let distribution =
      await DistributionService.getPendingDistributionForPartner(
        parsed.data.partnerId
      );
    const createdNewDistribution = !distribution;
    if (!distribution) {
      distribution = await DistributionService.createDistribution({
        partnerId: parsed.data.partnerId,
        pending: true,
      });
    }

    try {
      const allocation = await AllocationService.createAllocation({
        itemId: parsed.data.lineItem,
        partnerId: parsed.data.partnerId,
        distributionId: distribution!.id,
      });

      return NextResponse.json({ allocation, distribution }, { status: 201 });
    } catch (error) {
      if (createdNewDistribution) {
        // If we created a new distribution and allocation fails, clean up the distribution
        DistributionService.deleteDistribution(distribution!.id);
      }

      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
}

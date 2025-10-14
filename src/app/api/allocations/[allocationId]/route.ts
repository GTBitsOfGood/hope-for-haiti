import { auth } from "@/auth";
import AllocationService from "@/services/allocationService";
import DistributionService from "@/services/distributionService";
import UserService from "@/services/userService";
import {
  AuthenticationError,
  AuthorizationError,
  ArgumentError,
  errorResponse,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const idSchema = z.number().int().positive();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ allocationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Admin access required");
    }

    const parsed = idSchema.safeParse(Number((await params).allocationId));
    if (!parsed.success) {
      throw new ArgumentError("Invalid allocation ID");
    }

    const allocation = await AllocationService.getAllocation(parsed.data);

    await AllocationService.deleteAllocation(parsed.data);

    let deletedDistribution = false;
    if (allocation?.distributionId) {
      const distribution = await DistributionService.getDistribution(
        allocation.distributionId
      );

      if (distribution.allocations.length === 0) {
        // If the distribution has no more allocations, delete it
        deletedDistribution = true;
        DistributionService.deleteDistribution(distribution.id);
      }
    }

    return NextResponse.json({ deletedDistribution }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

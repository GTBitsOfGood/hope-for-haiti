import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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

const paramSchema = z.object({
  distributionId: z
    .string()
    .transform((value) => parseInt(value, 10))
    .pipe(z.number().int().positive("Distribution ID must be a positive integer")),
});

const requestSchema = z.object({
  allocations: z
    .array(
      z.object({
        partnerId: z.number().int().positive(),
        lineItemId: z.number().int().positive(),
      })
    )
    .min(1, "Allocations payload must include at least one allocation"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ distributionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Admin access required");
    }

    const { distributionId: rawDistributionId } = await params;
    const parsedParams = paramSchema.safeParse({ distributionId: rawDistributionId });
    if (!parsedParams.success) {
      throw new ArgumentError(parsedParams.error.message);
    }

    const body = await request.json();
    const parsedBody = requestSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new ArgumentError(parsedBody.error.message);
    }

    const distribution = await DistributionService.getDistribution(
      parsedParams.data.distributionId
    );

    const createdAllocations = await AllocationService.createBatchAllocations(
      distribution.id,
      parsedBody.data.allocations
    );

    return NextResponse.json({ allocations: createdAllocations }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

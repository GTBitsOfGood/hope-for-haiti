import { auth } from "@/auth";
import AllocationService from "@/services/allocationService";
import DistributionService from "@/services/distributionService";
import UserService from "@/services/userService";
import { allocationSchema } from "@/types/api/allocation.types";
import {
  AuthenticationError,
  errorResponse,
  ok,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const deleteSchema = z.object({
  allocations: z.array(z.number().min(1)),
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

    UserService.checkPermission(session.user, "allocationWrite");

    const form = await request.formData();
    const formObj = {
      partnerId:
        form.get("partnerId") != null
          ? Number(form.get("partnerId"))
          : undefined,
      lineItemId:
        form.get("lineItemId") != null
          ? Number(form.get("lineItemId"))
          : undefined,
      signOffId:
        form.get("signOffId") != null
          ? Number(form.get("signOffId"))
          : undefined,
    };
    const parsed = allocationSchema.safeParse(formObj);
    if (!parsed.success) {
      throw new Error("Invalid form data: " + parsed.error.message);
    }

    const distributionId = parseInt((await params).distributionId);
    if (isNaN(distributionId) || distributionId <= 0) {
      throw new Error("Invalid distribution ID");
    }

    const allocation = await AllocationService.createAllocation({
      partnerId: parsed.data.partnerId,
      itemId: parsed.data.lineItemId,
      signOffId: parsed.data.signOffId,
      distributionId,
    });

    return NextResponse.json(allocation, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ distributionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "allocationWrite");

    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      throw new Error("Invalid request data: " + parsed.error.message);
    }

    const distributionId = parseInt((await params).distributionId);
    if (isNaN(distributionId) || distributionId <= 0) {
      throw new Error("Invalid distribution ID");
    }

    await AllocationService.deleteManyAllocations(parsed.data.allocations);

    const distribution =
      await DistributionService.getDistribution(distributionId);

    if (distribution?.allocations.length === 0) {
      await DistributionService.deleteDistribution(distributionId);
    }

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

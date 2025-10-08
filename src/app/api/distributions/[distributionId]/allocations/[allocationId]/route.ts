import { auth } from "@/auth";
import AllocationService from "@/services/allocationService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
  ok,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  partnerId: z.number().optional(),
  lineItemId: z.number().optional(),
  signOffId: z.number().optional(),
});

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ distributionId: string; allocationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Admin access required");
    }

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
    const parsed = patchSchema.safeParse(formObj);
    if (!parsed.success) {
      throw new Error("Invalid form data: " + parsed.error.message);
    }

    const distributionId = parseInt((await params).distributionId);
    if (isNaN(distributionId) || distributionId <= 0) {
      throw new ArgumentError("Invalid distribution ID");
    }

    const allocationId = parseInt((await params).allocationId);
    if (isNaN(allocationId) || allocationId <= 0) {
      throw new ArgumentError("Invalid allocation ID");
    }

    const allocation = await AllocationService.updateAllocation(allocationId, {
      partnerId: parsed.data.partnerId,
      lineItemId: parsed.data.lineItemId,
      signOffId: parsed.data.signOffId,
    });

    return NextResponse.json(allocation);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _: NextRequest,
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

    const allocationId = parseInt((await params).allocationId);
    if (isNaN(allocationId) || allocationId <= 0) {
      throw new ArgumentError("Invalid allocation ID");
    }

    await AllocationService.deleteAllocation(allocationId);
    
    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

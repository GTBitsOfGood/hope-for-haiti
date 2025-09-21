import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
} from "@/util/errors";
import { errorResponse } from "@/util/errors";
import UserService from "@/services/userService";
import AllocationService from "@/services/allocationService";
import {
  createAllocationFormSchema,
  editAllocationFormSchema,
} from "@/schema/allocationForm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const form = await request.formData();
    const parsed = createAllocationFormSchema.safeParse(form);

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const result = await AllocationService.createAllocation(parsed.data);

    return NextResponse.json({
      message: "Allocation created",
      allocation: result,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const form = await request.formData();
    const parsed = editAllocationFormSchema.safeParse(form);

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const updatedAllocation = await AllocationService.updateAllocation(
      parsed.data
    );

    return NextResponse.json({
      message: "Allocation request modified",
      unallocatedItemRequestAllocation: updatedAllocation,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

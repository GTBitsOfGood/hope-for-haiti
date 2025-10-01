import { auth } from "@/auth";
import AllocationService from "@/services/allocationService";
import UserService from "@/services/userService";
import { allocationSchema } from "@/types/api/allocation.types";
import {
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";

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

    return NextResponse.json(allocation);
  } catch (error) {
    return errorResponse(error);
  }
}

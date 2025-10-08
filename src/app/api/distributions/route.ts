import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import UserService from "@/services/userService";
import DistributionService from "@/services/distributionService";
import {
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { allocationSchema } from "@/types/api/allocation.types";

const postSchema = z.object({
  partnerId: z.number().int().positive(),
  pending: z.boolean().optional(),
  allocations: z.array(allocationSchema).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const user = session.user;

    if (user.type === "PARTNER") {
      const partnerId = parseInt(user.id);
      const result =
        await DistributionService.getPartnerDistributions(partnerId);
      return NextResponse.json(result);
    }

    if (!UserService.isAdmin(user.type)) {
      throw new AuthorizationError("You are not allowed to view this");
    }

    const result = await DistributionService.getAllDistributions();
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
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
      partnerId: form.get("partnerId")
        ? parseInt(form.get("partnerId") as string)
        : undefined,
      pending: form.get("pending") ? form.get("pending") === "true" : undefined,
      allocations: form
        .getAll("allocation")
        .map((a) => JSON.parse(a as string)),
    };

    const parsed = postSchema.safeParse(formObj);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }

    const distribution = await DistributionService.createDistribution(
      parsed.data
    );
    return NextResponse.json(distribution, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

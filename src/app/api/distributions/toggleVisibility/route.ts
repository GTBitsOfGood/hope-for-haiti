import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import UserService from "@/services/userService";
import DistributionService from "@/services/distributionService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";

const searchParamsSchema = z.object({
  visible: z
    .string()
    .transform((val) => val === "true")
    .pipe(z.boolean()),
  allocType: z.enum(["unallocated", "donorOffer"]).optional(),
  id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined))
    .pipe(z.number().int().positive().optional()),
  partnerId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined))
    .pipe(z.number().int().positive().optional()),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("You are not allowed to toggle visibility");
    }

    const searchParams = new URL(request.url).searchParams;
    const parsed = searchParamsSchema.safeParse({
      visible: searchParams.get("visible"),
      allocType: searchParams.get("allocType"),
      id: searchParams.get("id"),
      partnerId: searchParams.get("partnerId"),
    });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { visible, allocType, id, partnerId } = parsed.data;

    if (allocType && id) {
      await DistributionService.toggleAllocationVisibility(allocType, id, visible);
    } else if (partnerId) {
      await DistributionService.togglePartnerVisibility(partnerId, visible);
    } else {
      throw new ArgumentError("Either allocType with id or partnerId must be provided");
    }

    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

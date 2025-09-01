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
    .optional()
    .transform((val) => {
      if (!val) return null;
      return val === "true" ? true : val === "false" ? false : null;
    }),
  partnerId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined))
    .pipe(z.number().int().positive()),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const user = session.user;

    if (user.type === "PARTNER") {
      const partnerId = parseInt(user.id);
      const result = await DistributionService.getPartnerDistributions(partnerId);
      return NextResponse.json(result);
    }

    if (!UserService.isAdmin(user.type)) {
      throw new AuthorizationError("You are not allowed to view this");
    }

    const searchParams = new URL(request.url).searchParams;
    const parsed = searchParamsSchema.safeParse({
      visible: searchParams.get("visible"),
      partnerId: searchParams.get("partnerId"),
    });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { visible, partnerId } = parsed.data;

    const result = await DistributionService.getAdminDistributions(partnerId, visible);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

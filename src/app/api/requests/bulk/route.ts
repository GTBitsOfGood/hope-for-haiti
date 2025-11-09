import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  errorResponse,
  AuthenticationError,
  ArgumentError,
} from "@/util/errors";
import UserService from "@/services/userService";
import { GeneralItemRequestService } from "@/services/generalItemRequestService";

const bulkUpdateSchema = z.object({
  updates: z.array(
    z.object({
      requestId: z.number().int().positive(),
      finalQuantity: z.number().int().nonnegative(),
    })
  ).min(1, "At least one update is required"),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "requestWrite");

    const json = await req.json().catch(() => ({}));
    const parsed = bulkUpdateSchema.safeParse(json);

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { updates } = parsed.data;

    const results = await GeneralItemRequestService.bulkUpdateRequests(updates);

    return NextResponse.json({
      success: true,
      updatedCount: results.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

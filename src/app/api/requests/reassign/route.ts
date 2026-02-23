import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { GeneralItemRequestService } from "@/services/generalItemRequestService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
} from "@/util/errors";

const bodySchema = z.object({
  requestId: z.number().int().positive(),
  targetGeneralItemId: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "requestWrite");

    const payload = await request.json();
    const parsed = bodySchema.safeParse({
      requestId: Number(payload.requestId),
      targetGeneralItemId: Number(payload.targetGeneralItemId),
    });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const result = await GeneralItemRequestService.reassignRequest(
      parsed.data.requestId,
      parsed.data.targetGeneralItemId
    );

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

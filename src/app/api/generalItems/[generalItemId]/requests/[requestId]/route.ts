import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import DonorOfferService from "@/services/donorOfferService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
  ok,
} from "@/util/errors";

const paramSchema = z.object({
  generalItemId: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(
      z.number().int().positive("General item ID must be a positive integer")
    ),
  requestId: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().int().positive("Request ID must be a positive integer")),
});

const updateRequestSchema = z.object({
  finalQuantity: z.number().int().min(0, "Final quantity must be non-negative"),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ generalItemId: string; requestId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const { generalItemId, requestId } = await params;
    const parsed = paramSchema.safeParse({ generalItemId, requestId });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const body = await req.json();
    const updateParsed = updateRequestSchema.safeParse(body);

    if (!updateParsed.success) {
      throw new ArgumentError(updateParsed.error.message);
    }

    await DonorOfferService.updateRequestFinalQuantity(
      parsed.data.requestId,
      updateParsed.data.finalQuantity
    );

    return NextResponse.json(ok());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ generalItemId: string; requestId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const { generalItemId, requestId } = await params;
    const parsed = paramSchema.safeParse({ generalItemId, requestId });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    // TODO: Implement delete request logic
    // await DonorOfferService.deleteRequest(parsed.data.requestId);

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import DonorOfferService from "@/services/donorOfferService";

const paramSchema = z.object({
  donorOfferId: z
    .string()
    .transform((value) => parseInt(value, 10))
    .pipe(
      z
        .number()
        .int()
        .positive("Donor offer ID must be a positive integer")
    ),
});

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("You are not allowed to view this");
    }

    const { donorOfferId } = await params;
    const parsed = paramSchema.safeParse({ donorOfferId });
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const result = await DonorOfferService.getAllocationItems(
      parsed.data.donorOfferId
    );

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

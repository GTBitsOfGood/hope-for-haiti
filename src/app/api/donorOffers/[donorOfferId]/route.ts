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
  donorOfferId: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(
      z.number().int().positive("Donor offer ID must be a positive integer")
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

    const { donorOfferId } = await params;
    const parsed = paramSchema.safeParse({ donorOfferId });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    let result;

    if (session.user.type === "PARTNER") {
      result = await DonorOfferService.getPartnerDonorOfferDetails(
        parsed.data.donorOfferId,
        session.user.id
      );
    } else if (UserService.isStaff(session.user.type)) {
      result = await DonorOfferService.getAdminDonorOfferDetails(
        parsed.data.donorOfferId
      );
    } else {
      throw new AuthorizationError("Unauthorized user type");
    }

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const { donorOfferId } = await params;
    const parsed = paramSchema.safeParse({ donorOfferId });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    await DonorOfferService.deleteDonorOffer(parsed.data.donorOfferId);
    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

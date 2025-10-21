import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import DonorOfferService from "@/services/donorOfferService";
import { DonorOfferState } from "@prisma/client";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  errorResponse,
} from "@/util/errors";

const paramSchema = z.object({
  donorOfferId: z
    .string()
    .transform((value) => parseInt(value, 10))
    .pipe(z.number().int().positive("Donor offer ID must be a positive integer")),
});

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("You are not allowed to submit donor offers");
    }

    const { donorOfferId: rawId } = await params;
    const parsedParams = paramSchema.safeParse({ donorOfferId: rawId });
    if (!parsedParams.success) {
      throw new ArgumentError(parsedParams.error.message);
    }

    const donorOfferId = parsedParams.data.donorOfferId;

    const donorOffer = await DonorOfferService.getDonorOfferForEdit(
      donorOfferId
    );

    if (!donorOffer) {
      throw new NotFoundError("Donor offer not found");
    }

    if (donorOffer.state !== DonorOfferState.FINALIZED) {
      throw new ArgumentError(
        "Only finalized donor offers can be submitted"
      );
    }

    await DonorOfferService.updateDonorOffer(donorOfferId, {
      state: DonorOfferState.ARCHIVED,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

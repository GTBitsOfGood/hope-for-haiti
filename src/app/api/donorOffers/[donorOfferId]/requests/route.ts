import { NextRequest } from "next/server";
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
    .pipe(z.number().int().positive("Donor offer ID must be a positive integer")),
});

const requestBodySchema = z.object({
  requests: z.array(z.object({
    title: z.string(),
    type: z.string(),
    expirationDate: z.string(),
    unitType: z.string(),
    quantity: z.number().optional(),
  })),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const { donorOfferId } = await params;
    const parsed = paramSchema.safeParse({ donorOfferId });
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const rawBody = await req.json();
    const bodyParsed = requestBodySchema.safeParse(rawBody);
    
    if (!bodyParsed.success) {
      throw new ArgumentError(bodyParsed.error.message);
    }

    await DonorOfferService.updateDonorOfferRequests(parsed.data.donorOfferId, bodyParsed.data.requests);

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

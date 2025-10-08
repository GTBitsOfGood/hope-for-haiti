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
import { $Enums } from "@prisma/client";
import { formDataToObject } from "@/util/formData";

/**
 * Schema for getting offer ID from URL params
 */
const paramSchema = z.object({
  donorOfferId: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(
      z.number().int().positive("Donor offer ID must be a positive integer")
    ),
});

const updateSchema = z.object({
  offerName: z.string().min(1, "Offer name is required").optional(),
  donorName: z.string().min(1, "Donor name is required").optional(),
  partnerResponseDeadline: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format for partnerResponseDeadline",
    })
    .transform((date) => new Date(date))
    .optional(),
  donorResponseDeadline: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format for donorResponseDeadline",
    })
    .transform((date) => new Date(date))
    .optional(),
  partners: z.array(z.number().int().positive()).optional(),
  state: z
    .enum(Object.values($Enums.DonorOfferState) as [string, ...string[]])
    .transform((val) => val as $Enums.DonorOfferState)
    .optional(),
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("You are not allowed to edit this");
    }

    const { donorOfferId } = await params;
    const parsed = paramSchema.safeParse({ donorOfferId });
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const formData = await req.formData();
    const formObj = formDataToObject(formData) as typeof updateSchema._input;

    const updateParsed = updateSchema.safeParse(formObj);
    if (!updateParsed.success) {
      throw new ArgumentError(updateParsed.error.message);
    }

    const result = await DonorOfferService.updateDonorOffer(
      parsed.data.donorOfferId,
      updateParsed.data
    );
    
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

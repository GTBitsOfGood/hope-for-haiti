import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import UserService from "@/services/userService";
import DonorOfferService from "@/services/donorOfferService";
import FileService from "@/services/fileService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
  InternalError,
} from "@/util/errors";

const paramSchema = z.object({
  donorOfferId: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().int().positive("Invalid donor offer ID")),
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

    const result = await DonorOfferService.getFinalizeDetails(parsed.data.donorOfferId);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("You are not allowed to finalize donor offers");
    }

    const { donorOfferId } = await params;
    const parsed = paramSchema.safeParse({ donorOfferId });
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const preview = formData.get("preview") === "true";

    if (!file) {
      throw new ArgumentError("File is required");
    }

    const parsedFileData = await FileService.parseFinalizeFile(file);
    const result = await DonorOfferService.finalizeDonorOffer(parsed.data.donorOfferId, formData, parsedFileData, preview);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ArgumentError || error instanceof AuthenticationError || error instanceof AuthorizationError || error instanceof InternalError) {
      return NextResponse.json({ 
        success: false, 
        errors: [error.message] 
      }, { status: error.statusCode });
    }
    
    return NextResponse.json({ 
      success: false, 
      errors: ["An unexpected error occurred"] 
    }, { status: 500 });
  }
}

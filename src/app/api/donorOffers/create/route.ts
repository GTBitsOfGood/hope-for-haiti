import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import UserService from "@/services/userService";
import DonorOfferService from "@/services/donorOfferService";
import FileService from "@/services/fileService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  InternalError,
} from "@/util/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("You are not allowed to create donor offers");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const preview = formData.get("preview") === "true";

    if (!file) {
      throw new ArgumentError("File is required");
    }

    const parsedFileData = await FileService.parseDonorOfferFile(file);
    const result = await DonorOfferService.createDonorOffer(formData, parsedFileData, preview);
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

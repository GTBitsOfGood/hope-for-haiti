import { NextResponse } from "next/server";

import { auth } from "@/auth";
import FileService from "@/services/fileService";
import UserService from "@/services/userService";
import {
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }
    
    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("You are not allowed to view this");
    }

    const result = await FileService.getMostRecentFile();
    
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

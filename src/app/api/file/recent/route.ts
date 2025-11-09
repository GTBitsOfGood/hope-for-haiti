import { NextResponse } from "next/server";

import { auth } from "@/auth";
import FileService from "@/services/fileService";
import UserService from "@/services/userService";
import {
  AuthenticationError,
  errorResponse,
} from "@/util/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }
    
    UserService.checkPermission(session.user, "requestRead");

    const result = await FileService.getMostRecentFile();
    
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

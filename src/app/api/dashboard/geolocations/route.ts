import { auth } from "@/auth";
import { isAdmin } from "@/lib/userUtils";
import UserService from "@/services/userService";
import {
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("User not authenticated");
    }

    if (!isAdmin(session.user.type)) {
      throw new AuthorizationError("User must be an admin");
    }

    const data = await UserService.getPartnerLocations();

    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

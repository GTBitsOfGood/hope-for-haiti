import { auth } from "@/auth";
import UserService from "@/services/userService";
import { AuthenticationError, AuthorizationError, errorResponse } from "@/util/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const tags = await UserService.getDistinctUserTags();
    return NextResponse.json(tags, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

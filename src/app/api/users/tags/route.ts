import { auth } from "@/auth";
import UserService from "@/services/userService";
import { AuthenticationError, errorResponse } from "@/util/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "userRead");

    const tags = await UserService.getDistinctUserTags();
    return NextResponse.json(tags, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

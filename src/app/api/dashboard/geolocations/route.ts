import { auth } from "@/auth";
import UserService from "@/services/userService";
import {
  AuthenticationError,
  errorResponse,
} from "@/util/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("User not authenticated");
    }

    UserService.checkStaff(session.user);

    const data = await UserService.getPartnerLocations();

    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

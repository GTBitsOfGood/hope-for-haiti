import { auth } from "@/auth";
import { errorResponse } from "@/util/errors";
import { PartnerService } from "@/services/partnerService";
import { AuthenticationError, AuthorizationError } from "@/util/errors";
import { NextResponse } from "next/server";
import UserService from "@/services/userService";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isSuperAdmin(session.user.type)) {
      throw new AuthorizationError("Must be SUPER_ADMIN");
    }

    const partnerEmails = await PartnerService.getPartnerEmails();

    return NextResponse.json({
      partnerEmails,
    }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

import { auth } from "@/auth";
import StreamIoService from "@/services/streamIoService";
import UserService from "@/services/userService";
import {
  AuthenticationError,
  ArgumentError,
  errorResponse,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (!q) {
      return NextResponse.json({ cids: [] });
    }

    if (UserService.isPartner(session.user)) {
      if (!session.user.streamUserId) {
        throw new ArgumentError("Account not linked to chat");
      }
      const cids = await StreamIoService.searchMessageCids(
        session.user.streamUserId,
        q
      );
      return NextResponse.json({ cids });
    }

    UserService.checkPermission(session.user, "supportRead");
    if (!session.user.streamUserId) {
      throw new ArgumentError("Account not linked to chat");
    }
    const cids = await StreamIoService.searchMessageCids(
      session.user.streamUserId,
      q
    );
    return NextResponse.json({ cids });
  } catch (error) {
    return errorResponse(error);
  }
}

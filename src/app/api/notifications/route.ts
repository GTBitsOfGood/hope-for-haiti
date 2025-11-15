import { auth } from "@/auth";
import { NotificationService } from "@/services/notificationService";
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

    const notifications =
      await NotificationService.getUnreadNotificationsForUser(
        Number(session.user.id)
      );

    return NextResponse.json({ notifications });
  } catch (error) {
    return errorResponse(error);
  }
}
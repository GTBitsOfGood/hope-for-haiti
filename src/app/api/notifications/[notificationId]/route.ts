import { auth } from "@/auth";
import { NotificationService } from "@/services/notificationService";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
} from "@/util/errors";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ notificationid: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const { notificationid } = await params;

    const notificationIdNum = Number(notificationid);
    if (isNaN(notificationIdNum)) {
      throw new ArgumentError("Invalid notification ID");
    }

    const updatedNotification =
      await NotificationService.markNotificationAsViewed(notificationIdNum);

    return NextResponse.json({ notification: updatedNotification });
  } catch (error) {
    return errorResponse(error);
  }
}

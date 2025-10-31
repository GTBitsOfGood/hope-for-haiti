import { auth } from "@/auth";
import { NotificationService } from "@/services/notificationService";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
} from "@/util/errors";
import { NextResponse } from "next/server";
import { z } from "zod";

const idSchema = z.object({
  notificationId: z.coerce.number().int().positive(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const parsed = idSchema.safeParse(await params);
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const notificationIdNum = parsed.data.notificationId;

    const existingNotification =
      await NotificationService.getNotificationById(notificationIdNum);

    if (
      !existingNotification ||
      existingNotification.userId !== Number(session.user.id)
    ) {
      throw new ArgumentError("Notification not found");
    }

    if (existingNotification.dateViewed) {
      // Notification already viewed, no update needed
      return NextResponse.json({ notification: existingNotification });
    }

    const updatedNotification =
      await NotificationService.markNotificationAsViewed(notificationIdNum);

    return NextResponse.json({ notification: updatedNotification });
  } catch (error) {
    return errorResponse(error);
  }
}

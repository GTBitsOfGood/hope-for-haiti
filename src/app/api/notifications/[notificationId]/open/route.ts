import { auth } from "@/auth";
import { NotificationService } from "@/services/notificationService";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const idSchema = z.object({
  notificationId: z.coerce.number().int().positive(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const idParsed = idSchema.safeParse(await params);
    if (!idParsed.success) {
      throw new ArgumentError(idParsed.error.message);
    }

    const { notificationId } = idParsed.data;

    const notification = await NotificationService.getNotificationById(notificationId);

    if (!notification || notification.userId !== Number(session.user.id)) {
      throw new ArgumentError("Notification not found");
    }

    await NotificationService.updateNotification(notificationId, {
      view: true,
    });

    return NextResponse.redirect(notification.action ?? `${process.env.BASE_URL}/`);
  } catch (error) {
    return errorResponse(error);
  }
}

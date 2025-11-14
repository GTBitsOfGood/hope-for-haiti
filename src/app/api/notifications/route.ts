import { auth } from "@/auth";
import { NotificationService } from "@/services/notificationService";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
} from "@/util/errors";
import { NextResponse } from "next/server";
import { z } from "zod";

const createNotificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  action: z.string().min(1).optional(),
  actionText: z.string().min(1).optional(),
});

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

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const body = await request.json();
    const parsed = createNotificationSchema.safeParse(body);

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const userId = Number(session.user.id);

    const notification = await NotificationService.createNotification({
      title: parsed.data.title,
      action: parsed.data.action ?? null,
      actionText: parsed.data.actionText ?? null,
      user: {
        connect: { id: userId },
      },
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

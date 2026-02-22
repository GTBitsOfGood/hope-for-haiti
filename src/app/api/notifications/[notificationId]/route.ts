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

const searchParamsSchema = z.object({
  view: z.coerce.boolean().optional().nullable(),
  delivery: z.coerce.boolean().optional().nullable(),
});

export async function PATCH(
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

    const existingNotification =
      await NotificationService.getNotificationById(notificationId);

    if (
      !existingNotification ||
      existingNotification.userId !== Number(session.user.id)
    ) {
      throw new ArgumentError("Notification not found");
    }

    const searchParams = searchParamsSchema.safeParse({
      delivery: request.nextUrl.searchParams.get("delivery"),
      view: request.nextUrl.searchParams.get("view"),
    });

    if (!searchParams.success) {
      throw new ArgumentError(searchParams.error.message);
    }

    const updatedNotification = NotificationService.updateNotification(
      notificationId,
      {
        delivery: searchParams.data.delivery ?? undefined,
        view: searchParams.data.view ?? undefined,
      }
    );

    return NextResponse.json({ notification: updatedNotification });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const resolvedParams = await params;

    await NotificationService.deleteNotification(
      Number(resolvedParams.notificationId),
      Number(session.user.id)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

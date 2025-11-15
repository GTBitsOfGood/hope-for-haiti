import { db } from "@/db";
import { Notification, Prisma } from "@prisma/client";
import Ably from "ably";
import { InternalError } from "@/util/errors";

export class NotificationService {
  private static restClient: Ably.Rest | null = null;

  private static getRestClient() {
    const apiKey = process.env.ABLY_API_KEY;
    if (!apiKey) {
      throw new InternalError("ABLY_API_KEY not configured");
    }

    if (!this.restClient) {
      this.restClient = new Ably.Rest(apiKey);
    }

    return this.restClient;
  }

  static async createNotification(data: Prisma.NotificationCreateInput) {
    const notification = await db.notification.create({ data });
    await this.publishNotification(notification);
    return notification;
  }

  static async createNotifications(userIds: number[], data: Omit<Prisma.NotificationCreateInput, "user">) {
    const notifications = await db.$transaction(
      userIds.map((userId) =>
        db.notification.create({
          data: { ...data, user: { connect: { id: userId } } },
        }),
      ),
    );

    await Promise.all(notifications.map((notification) => this.publishNotification(notification)));
  }

  private static async publishNotification(notification: Notification) {
    const client = this.getRestClient();
    const channelName = `${process.env.NODE_ENV}:user:${notification.userId}`;
    const payload = {
      id: notification.id,
      title: notification.title,
      action: notification.action,
      actionText: notification.actionText,
      dateCreated: notification.dateCreated.toISOString(),
      dateViewed: notification.dateViewed
        ? notification.dateViewed.toISOString()
        : null,
      userId: notification.userId,
    };

    await client.channels.get(channelName).publish("notification:new", payload);
  }

  static async getNotificationById(notificationId: number) {
    return await db.notification.findUnique({
      where: { id: notificationId },
    });
  }

  static async getUnreadNotificationsForUser(userId: number) {
    return await db.notification.findMany({
      where: {
        userId,
        dateViewed: null,
      },
      orderBy: {
        dateCreated: "desc",
      },
    });
  }

  static async updateNotification(notificationId: number, data: {view?: boolean, delivery?: boolean}) {
    return await db.notification.update({
      where: { id: notificationId },
      data: { 
        dateViewed: data.view ? new Date() : undefined,
        isDelivered: data.delivery 
      },
    });
  }
}

import { db } from "@/db";
import { Prisma } from "@prisma/client";

export class NotificationService {
  static async createNotification(data: Prisma.NotificationCreateInput) {
    return await db.notification.create({
      data,
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

  static async markNotificationAsViewed(notificationId: number) {
    return await db.notification.update({
      where: { id: notificationId },
      data: { dateViewed: new Date() },
    });
  }
}

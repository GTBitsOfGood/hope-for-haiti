import { schedule } from "@netlify/functions";
import { UserType } from "@prisma/client";

import { GeneralItemService } from "../../src/services/generalItemService";
import { db } from "../../src/db";
import { NotificationService } from "@/services/notificationService";

const LOOKAHEAD_DAYS = 30;

export const handler = schedule("@daily", async () => {
  try {
    const cutoff = new Date(Date.now() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);
    const expiringItems = await GeneralItemService.getExpiringItems(cutoff);

    if (expiringItems.length === 0) {
      return {
        statusCode: 200,
      };
    }

    const staffUsers = await db.user.findMany({
      where: {
        type: {
          in: [UserType.SUPER_ADMIN, UserType.ADMIN, UserType.STAFF],
        },
        enabled: true,
      },
      select: {
        id: true,
      },
    });

    if (staffUsers.length === 0) {
      return {
        statusCode: 200,
      };
    }

    const templateItems = expiringItems.map((item) => ({
      id: item.item.id,
      title: item.item.title,
      expirationDate: item.item.expirationDate,
      unallocatedQuantity: item.unallocatedQuantity,
      distributedQuantity: item.allocatedQuantity,
    }));

    await NotificationService.createNotifications(staffUsers.map(s => s.id), {
      title: "Items Expiring",
      action: `${process.env.BASE_URL}/`,
      actionText: "View the expiring items",
      template: "ExpiringItems",
      payload: {
        items: templateItems,
        cutoffDays: LOOKAHEAD_DAYS,
      }
    })

    return {
      statusCode: 200,
    };
  } catch (error) {
    console.error("Failed to send expiring items email", error);
    return {
      statusCode: 500,
    };
  }
});

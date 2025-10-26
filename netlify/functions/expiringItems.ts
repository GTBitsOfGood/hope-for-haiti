import { schedule } from "@netlify/functions";
import { format } from "date-fns";
import { UserType } from "@prisma/client";

import { GeneralItemService } from "../../src/services/generalItemService";
import { EmailClient } from "../../src/email";
import { db } from "../../src/db";

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
        email: true,
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

    const monthLabel = format(cutoff, "MMMM yyyy");

    await EmailClient.sendItemsExpiring(staffUsers.map(s => s.email), {
      month: monthLabel,
      items: templateItems,
    });

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

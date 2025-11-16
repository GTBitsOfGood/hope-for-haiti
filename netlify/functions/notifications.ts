import { schedule } from "@netlify/functions";
import { Notification, Prisma } from "@prisma/client";
import { render } from "@react-email/components";
import type { ReactElement } from "react";

import { db } from "../../src/db";
import { sendEmail } from "../../src/email";
import * as emailTemplates from "../../src/email/templates";

const BATCH_SIZE = 10;
const DELIVERY_DELAY_MS = 30 * 1000;

type EmailTemplateName = keyof typeof emailTemplates;
type EmailTemplateComponent = (props: any) => ReactElement;

type NotificationToSend = Notification & {
  template: string;
  payload: Prisma.JsonValue;
  user: {
    email: string;
  };
};

export const handler = schedule("*/5 * * * *", async () => {
  try {
    const cutoff = new Date(Date.now() - DELIVERY_DELAY_MS);

    const pendingNotifications = await db.notification.findMany({
      where: {
        isDelivered: false,
        template: { not: null },
        dateCreated: { lt: cutoff },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        dateCreated: "asc",
      },
    });

    const notifications = pendingNotifications.filter((notification): notification is NotificationToSend => {
      return !notification.isDelivered && Boolean(notification.template);
    });

    if (notifications.length === 0) {
      return {
        statusCode: 200,
      };
    }

    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      const batch = notifications.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((notification) => sendNotificationEmail(notification)));
    }

    return {
      statusCode: 200,
    };
  } catch (error) {
    console.error("Failed to process notification emails: ", error);
    return {
      statusCode: 500,
    };
  }
});

async function sendNotificationEmail(notification: NotificationToSend) {
  const TemplateComponent = getTemplateComponent(notification.template);

  if (!TemplateComponent) {
    console.warn(`Notification template "${notification.template}" not found for ${notification.id}`);
    return;
  }

  try {
    const props = {
      notificationId: notification.id,
      ...(typeof notification.payload === 'object' && notification.payload !== null ? notification.payload : {})
    };
    const html = await render(TemplateComponent(props));

    const subject = notification.title;

    await sendEmail(notification.user.email, subject, html);

    await db.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        isDelivered: true,
      },
    });
  } catch (error) {
    console.error(`Failed to send notification email for ${notification.id}`, error);
  }
} 

function getTemplateComponent(templateName: string): EmailTemplateComponent | null {
  if (!Object.prototype.hasOwnProperty.call(emailTemplates, templateName)) {
    return null;
  }

  return emailTemplates[templateName as EmailTemplateName] as unknown as EmailTemplateComponent;
}

import { schedule } from "@netlify/functions";
import { StreamChat } from "stream-chat";

import { db } from "../../src/db";
import { EmailClient } from "../../src/email";
import { ExtraChannelData } from "@/types/api/streamio.types";

const BATCH_SIZE = 10;

const streamClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAMIO_API_KEY!,
  process.env.STREAMIO_SECRET_KEY!
);

type UserRecord = {
  id: number;
  name: string;
  email: string;
  streamUserId: string;
};

export const handler = schedule("*/15 * * * *", async () => {
  try {
    const users = await db.user.findMany({
      where: {
        enabled: true,
        streamUserId: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        streamUserId: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    const readableUsers = users.filter(
      (user): user is UserRecord => Boolean(user.streamUserId)
    );

    if (readableUsers.length === 0) {
      return { statusCode: 200 };
    }

    const userUnreadMap = (await streamClient.getUnreadCountBatch(readableUsers.map(u => u.streamUserId))).counts_by_user;

    const channelIds = Array.from(new Set(
      Object.values(userUnreadMap).flatMap(( { channels }) =>
        channels.map((channel) => channel.channel_id)
      )
    ));

    const channelIdToName = await getChannelNames(channelIds);

    const emailPayloads = [];
    for (const user of readableUsers) {
      const channels = userUnreadMap[user.streamUserId].channels;
      if (!channels.length) continue;

      const channelSummaries = channels.map((channelInfo) => {
          const name = channelIdToName.get(channelInfo.channel_id) ?? "Support Ticket";
          const url = `${process.env.BASE_URL}/support?channel-id=${channelInfo.channel_id.split(":")[1]}`;

          return {
            name,
            unreadCount: channelInfo.unread_count,
            url,
          };
        }
      );

      if (!channelSummaries.length) continue;

      emailPayloads.push({
        to: user.email,
        props: {
          userName: user.name,
          channels: channelSummaries,
        },
      });
    }

    for (let i = 0; i < emailPayloads.length; i += BATCH_SIZE) {
      const batch = emailPayloads.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((message) => EmailClient.sendSupportTicketUnread(message.to, message.props))
      );
    }

    return {
      statusCode: 200,
    };
  } catch (error) {
    console.error("Failed to process support notifications:", error);
    return {
      statusCode: 500,
    };
  }
});

async function getChannelNames(channelIds: string[]) {
  const idToName = new Map<string, string>();

  if (channelIds.length === 0) {
    return idToName;
  }

  const channels = await streamClient.queryChannels(
    { cid: { $in: channelIds }, type: "ticket" },
  );

  channels.forEach((channel) => {
    if (!channel.id) return;
    idToName.set(channel.cid, (channel.data as ExtraChannelData).name)
  });

  return idToName;
}

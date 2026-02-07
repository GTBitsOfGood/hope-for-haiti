import { ChannelData, StreamChat } from "stream-chat";

export default class StreamIoService {
  private static client: StreamChat = StreamChat.getInstance(
    process.env.NEXT_PUBLIC_STREAMIO_API_KEY!,
    process.env.STREAMIO_SECRET_KEY!
  );

  static getUserIdFromUser(user: { email: string }): string {
    return user.email.toLowerCase().replace(".", "_");
  }

  /**
   * If the user was previously deleted or deactivated, this method will reactivate or restore them.
   * @returns A Stream Chat user token
   */
  static async createUser(
    user: { email: string; name: string },
    isAdmin: boolean
  ): Promise<{
    userId: string;
    userToken: string;
  }> {
    const userId = this.getUserIdFromUser(user);

    try {
      const userToken = StreamIoService.client.createToken(userId);

      await StreamIoService.client.upsertUser({
        id: userId,
        name: user.name,
        role: isAdmin ? "admin" : "user",
      });

      return {
        userId,
        userToken,
      };
    } catch (err) {
      // console.error("Error creating Stream Chat user:", err);
      if (err instanceof Error && err.message.includes("was deleted")) {
        // If the user was deleted, reactivate them
        await this.restoreUser(userId);
        const userToken = StreamIoService.client.createToken(userId);

        return {
          userId,
          userToken,
        };
      }

      throw err;
    }
  }

  /**
   * If a user was deactivated, reactivate them.
   * If they were deleted, use restoreUser instead.
   * @see restoreUser
   */
  static async reactivateUser(userId: string) {
    return await StreamIoService.client.reactivateUser(userId);
  }

  /**
   * If a user was deleted (not deactivated), restore them.
   * If they were deactivated, use reactivateUser instead.
   * @see reactivateUser
   */
  static async restoreUser(userId: string) {
    return await StreamIoService.client.restoreUsers([userId]);
  }

  static async deactivateUser(userId: string): Promise<void> {
    try {
      await StreamIoService.client.deactivateUser(userId);
    } catch (err) {
      if (err instanceof Error && err.message.includes("was deleted")) {
        return; // Soft deletes are okay - we can reactivate later - and we don't hard delete anywhere
      }
      throw err;
    }
  }

  /**
   * Fully and permanently deletes a user and all their messages.
   */
  static async hardDeleteUser(userId: string): Promise<void> {
    await StreamIoService.client.deleteUser(userId, {
      hard_delete: true,
      mark_messages_deleted: true,
    });
  }

  private static channelNameToId(name: string): string {
    const baseId = name.toLowerCase().replace(/\s+/g, "-");
    // Add timestamp to ensure uniqueness (prevents reusing closed channels)
    const timestamp = Date.now();
    return `${baseId}-${timestamp}`;
  }

  /**
   * @param memberIds stream user IDs, not DB user IDs
   * @param extraData extra config for the channel, including whether it's closed
   */
  static async createTicketChannel(
    channelName: string,
    channelImage: string,
    partnerName: string,
    createdById: string,
    memberIds: string[],
    extraData: ChannelData
  ) {
    const channelId = this.channelNameToId(channelName);
    const channel = StreamIoService.client.channel("ticket", channelId, {
      created_by_id: createdById,
      members: memberIds,
      name: channelName,
      image: channelImage,
      partnerName,
      ...extraData,
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    await channel.create();

    return channel;
  }

  /**
   * Deletes all channels from Stream Chat.
   * This is used for clearing/resetting the chat system.
   */
  static async deleteAllChannels(): Promise<void> {
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      try {
        const channels = await StreamIoService.client.queryChannels(
          { type: "ticket" },
          {},
          { limit, offset }
        );

        if (channels.length === 0) {
          hasMore = false;
          break;
        }

        // Delete each channel
        await Promise.all(
          channels.map(async (channel) => {
            try {
              await channel.delete();
            } catch (err) {
              console.error(`Failed to delete channel ${channel.id}:`, err);
            }
          })
        );

        if (channels.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      } catch (err) {
        console.error("Error querying/deleting channels:", err);
        throw err;
      }
    }
  }

  static async closeChannel(channelId: string): Promise<void> {
    const channel = this.client.channel("ticket", channelId);
    await channel.update({ closed: true } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  static async getChannelMembers(channelId: string): Promise<string[]> {
    const channel = this.client.channel("ticket", channelId);
    const response = await channel.queryMembers({}); // eslint-disable-line @typescript-eslint/no-explicit-any

    return response.members.map(member => member.user_id).filter(Boolean) as string[];
  }
}

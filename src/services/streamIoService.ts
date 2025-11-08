import { ChannelData, StreamChat } from "stream-chat";

export default class StreamIoService {
  private static client: StreamChat = StreamChat.getInstance(
    process.env.NEXT_PUBLIC_STREAMIO_API_KEY!,
    process.env.STREAMIO_SECRET_KEY!
  );

  private static getUserIdFromUser(user: { email: string }): string {
    return user.email.toLowerCase().replace(".", "_");
  }

  /**
   * If the user was previously deleted or deactivated, this method will reactivate or restore them.
   * @returns A Stream Chat user token
   */
  static async createUser(user: { email: string; name: string }): Promise<{
    userId: string;
    userToken: string;
  }> {
    const userId = this.getUserIdFromUser(user);

    try {
      const userToken = StreamIoService.client.createToken(userId);

      await StreamIoService.client.upsertUser({
        id: userId,
        name: user.name,
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

  private static channelNameToId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, "-");
  }

  /**
   * @param memberIds stream user IDs, not DB user IDs
   * @param extraData extra config for the channel, including whether it's closed
   */
  static async createTicketChannel(
    channelName: string,
    channelImage: string,
    createdById: string,
    memberIds: string[],
    extraData: ChannelData & {
      closed: boolean;
    } = {
      closed: false,
    }
  ) {
    const channelId = this.channelNameToId(channelName);
    const channel = StreamIoService.client.channel("ticket", channelId, {
      created_by_id: createdById,
      members: memberIds,
      ...{
        name: channelName, // For some reason, TS has problems putting name outside this object
        image: channelImage,
        ...extraData,
      },
    });

    await channel.create();

    return channel;
  }
}

import { auth } from "@/auth";
import { isAdmin, isPartner } from "@/lib/userUtils";
import StreamIoService from "@/services/streamIoService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
} from "@/util/errors";
import { $Enums } from "@prisma/client";
import { NextResponse } from "next/server";
import { ChannelData } from "stream-chat";
import { z } from "zod";

const postSchema = z.object({
  ticketName: z.string().min(1).max(100),
  partnerId: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("Not authenticated");
    }

    const body = await req.json();
    const parsedBody = postSchema.safeParse(body);

    if (!parsedBody.success) {
      throw new ArgumentError(parsedBody.error.message);
    }

    const ticketName = parsedBody.data.ticketName;
    let partnerStreamUserId: string | null = null;
    let partnerName: string | null = null;

    if (!isAdmin(session.user.type)) {
      partnerStreamUserId = session.user.streamUserId;
      partnerName = session.user.name!;
    } else {
      if (!parsedBody.data.partnerId) {
        throw new ArgumentError(
          "partnerId is required when creating a ticket as an admin"
        );
      }

      const user = await UserService.getUserById(parsedBody.data.partnerId);
      if (!user) {
        throw new ArgumentError("No user found with the given partnerId");
      }

      if (!isPartner(user.type)) {
        throw new ArgumentError(
          "The specified user is not registered as a partner"
        );
      }

      if (!user.streamUserId) {
        throw new ArgumentError(
          "The specified partner has not been linked to stream.io"
        );
      }

      partnerStreamUserId = user.streamUserId;
      partnerName = user.name;
    }

    const channelImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      partnerName
    )}&background=random&size=128`;

    const admins = await UserService.getUsers({
      type: {
        type: "enum",
        values: [$Enums.UserType.ADMIN, $Enums.UserType.SUPER_ADMIN],
      },
    });

    const streamUsers = admins.users
      .map((admin) => admin.streamUserId!)
      .concat([partnerStreamUserId!]);

    const extraData: ChannelData & { closed: boolean } = {
      closed: false,
    };

    const channel = await StreamIoService.createTicketChannel(
      ticketName,
      channelImage,
      partnerName!,
      session!.user.streamUserId!,
      streamUsers,
      extraData
    );

    return NextResponse.json({ channelId: channel.id });
  } catch (error) {
    return errorResponse(error);
  }
}

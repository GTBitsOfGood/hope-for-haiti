import { auth } from "@/auth";
import { isAdmin } from "@/lib/userUtils";
import StreamIoService from "@/services/streamIoService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
  ok,
} from "@/util/errors";
import { z } from "zod";

const channelIdSchema = z.object({
  channelId: z.string().min(1),
});

const patchSchema = z.object({
  closed: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("Not authenticated");
    }

    if (!isAdmin(session.user.type)) {
      throw new AuthorizationError("Must be an admin to update tickets");
    }

    const parsedParams = channelIdSchema.safeParse(await params);
    if (!parsedParams.success) {
      throw new ArgumentError(parsedParams.error.message);
    }

    const body = await req.json();
    const parsedBody = patchSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new ArgumentError(parsedBody.error.message);
    }

    const channelId = parsedParams.data.channelId;
    const closed = parsedBody.data.closed;

    await StreamIoService.updateChannelData(
      channelId,
      closed !== undefined ? { closed } : {}
    );

    return ok();
  } catch (err) {
    return errorResponse(err);
  }
}

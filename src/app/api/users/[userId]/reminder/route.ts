import { NextRequest } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
  ok,
} from "@/util/errors";

const paramSchema = z.object({
  userId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive("User ID must be a positive integer")),
});

export async function POST(
    _: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "userWrite");

    const { userId } = await params;
    const parsed = paramSchema.safeParse({ userId });
    if (!parsed.success) {
        throw new ArgumentError(parsed.error.message);
    }

    await UserService.sendInviteReminder(parsed.data.userId);

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

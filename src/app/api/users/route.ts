import { auth } from "@/auth";
import {
  AuthenticationError,
  AuthorizationError,
  ArgumentError,
  errorResponse,
  ok,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import UserService from "@/services/userService";

const createUserSchema = zfd.formData({
  inviteToken: zfd.text(),
  password: zfd.text(),
});

const searchParamsSchema = z.object({
  includeInvites: z
    .preprocess((val) => {
      if (typeof val === "string") {
        const lower = val.toLowerCase();
        if (lower === "true") return true;
        if (lower === "false") return false;
      }
      return val;
    }, z.boolean().optional()),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }
  
    const { user } = session;
    // FIXME: permission & message mismatch
    if (!UserService.isAdmin(user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const { searchParams } = new URL(request.url);
    const parsed = searchParamsSchema.safeParse({
      includeInvites: searchParams.get("includeInvites") ?? undefined,
    });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const users = await UserService.getUsers();

    if (parsed.data.includeInvites) {
      const invites = await UserService.getUserInvites();
      return NextResponse.json({ users, invites }, { status: 200 });
    }

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const parsed = createUserSchema.safeParse(await req.formData());
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { inviteToken, password } = parsed.data;

    await UserService.createUserFromInvite({ inviteToken, password });
    
    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

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
import { tableParamsSchema } from "@/schema/tableParams";

const createUserSchema = zfd.formData({
  inviteToken: zfd.text(),
  password: zfd.text(),
});

const includeInvitesParamsSchema = z.object({
  includeInvites: z.string().optional().nullable().transform(val => val === "true")
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }
  
    const { user } = session;
    if (!UserService.isStaff(user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const parsed = tableParamsSchema.merge(includeInvitesParamsSchema).safeParse({
      filters: request.nextUrl.searchParams.get("filters"),
      page: request.nextUrl.searchParams.get("page"),
      pageSize: request.nextUrl.searchParams.get("pageSize"),
      includeInvites: request.nextUrl.searchParams.get("includeInvites"),
    });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { filters, page, pageSize, includeInvites } = parsed.data;

    const { users, total } = await UserService.getUsers(
      filters ?? undefined,
      page ?? undefined,
      pageSize ?? undefined
    );

    if (includeInvites) {
      const invites = await UserService.getUserInvites();
      return NextResponse.json({ users, invites, total  }, { status: 200 });
    }

    return NextResponse.json({ users, total }, { status: 200 });
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

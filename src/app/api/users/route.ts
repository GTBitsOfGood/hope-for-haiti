import { auth } from "@/auth";
import {
  AuthenticationError,
  AuthorizationError,
  ArgumentError,
  errorResponse,
  ok,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { zfd } from "zod-form-data";
import UserService from "@/services/userService";

const createUserSchema = zfd.formData({
  inviteToken: zfd.text(),
  password: zfd.text(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }
  
    const { user } = session;
    if (!UserService.isStaff(user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const users = await UserService.getUsers();

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

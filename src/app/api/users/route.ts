import { auth } from "@/auth";
import {
  AuthenticationError,
  ArgumentError,
  errorResponse,
  ok,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { zfd } from "zod-form-data";
import UserService from "@/services/userService";
import { tableParamsSchema } from "@/schema/tableParams";

const createUserSchema = zfd.formData({
  inviteToken: zfd.text(),
  password: zfd.text(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }
  
    const { user } = session;
    UserService.checkPermission(user, "userRead");

    const parsed = tableParamsSchema.safeParse({
      filters: request.nextUrl.searchParams.get("filters"),
      page: request.nextUrl.searchParams.get("page"),
      pageSize: request.nextUrl.searchParams.get("pageSize"),
    });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { filters, page, pageSize } = parsed.data;

    const { users, total } = await UserService.getUsers(
      filters ?? undefined,
      page ?? undefined,
      pageSize ?? undefined
    );

    return NextResponse.json({ users, total }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // This endpoint allows unauthenticated access for user registration from invites
    // The inviteToken validates the request
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

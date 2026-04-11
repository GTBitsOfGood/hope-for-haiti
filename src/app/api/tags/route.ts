import { auth } from "@/auth";
import UserService from "@/services/userService";
import {
  AuthenticationError,
  ArgumentError,
  errorResponse,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createTagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name cannot be empty")
    .max(50, "Tag name is too long"),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "userRead");

    const tags = await UserService.getAllTags();
    return NextResponse.json(tags, { status: 200 });
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

    UserService.checkPermission(session.user, "userWrite");

    const body = await req.json();
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const tag = await UserService.createTag(parsed.data.name);
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

import { auth } from "@/auth";
import UserService from "@/services/userService";
import {
  AuthenticationError,
  AuthorizationError,
  ArgumentError,
  errorResponse,
  ok,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { UserType } from "@prisma/client";
import { EDITABLE_PERMISSION_FIELDS } from "@/types/api/user.types";

const paramSchema = z.object({
  userId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive("User ID must be a positive integer")),
});

const permissionsSchema = z
  .object(
    EDITABLE_PERMISSION_FIELDS.reduce(
      (shape, field) => {
        shape[field] = z.boolean().optional();
        return shape;
      },
      {} as Record<
        (typeof EDITABLE_PERMISSION_FIELDS)[number],
        z.ZodOptional<z.ZodBoolean>
      >
    )
  )
  .partial();

const patchBodySchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  tag: z.string().optional(),
  role: z.nativeEnum(UserType).optional(),
  enabled: z.boolean().optional(),
  permissions: permissionsSchema.optional(),
});

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const { userId } = await params;
    const parsed = paramSchema.safeParse({ userId });
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    if (session.user.id !== userId) {
      UserService.checkPermission(session.user, "userRead");
    }

    const user = await UserService.getUserById(parsed.data.userId);

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
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

    const body = await req.json();
    const bodyParsed = patchBodySchema.safeParse(body);
    if (!bodyParsed.success) {
      throw new ArgumentError(bodyParsed.error.message);
    }
    
    // These checks relate to the session user - the ones in userService relate to the target user
    const isSelf = session.user.id === parsed.data.userId.toString();

    if (isSelf) {
      if (bodyParsed.data.permissions) {
        throw new AuthorizationError("Cannot modify your own permissions");
      }
      if (bodyParsed.data.enabled !== undefined) {
        throw new AuthorizationError("Cannot modify your own enabled status");
      }
    }

    if (bodyParsed.data.permissions?.userWrite !== undefined && !session.user.isSuper) {
      throw new AuthorizationError("You must have isSuper to edit userWrite permission");
    }

    await UserService.updateUser({
      userId: parsed.data.userId,
      name: bodyParsed.data.name,
      email: bodyParsed.data.email,
      type: bodyParsed.data.role,
      tag: bodyParsed.data.tag,
      enabled: bodyParsed.data.enabled,
      permissions: bodyParsed.data.permissions,
    });

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

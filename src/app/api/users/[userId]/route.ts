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

const paramSchema = z.object({
  userId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive("User ID must be a positive integer")),
});

const patchBodySchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  tag: z.string().optional(),
  role: z.nativeEnum(UserType).optional(),
  enabled: z.boolean().optional(),
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

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Must be ADMIN, STAFF, or SUPER_ADMIN");
    }

    const { userId } = await params;
    const parsed = paramSchema.safeParse({ userId });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

     if (!UserService.isStaff(session.user.type) && parsed.data?.userId.toString() !== session.user.id) {
       throw new AuthorizationError("You are not allowed to view this");
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

		if (!UserService.isAdmin(session.user.type)) {
			throw new AuthorizationError("Must be ADMIN or SUPER_ADMIN");
		}

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

		const currentUser = await UserService.getUserById(parsed.data.userId);
		const requestedRole = bodyParsed.data.role;
		if (requestedRole) {
			if (
				currentUser.type === UserType.PARTNER &&
				requestedRole !== UserType.PARTNER
			) {
				throw new ArgumentError("Cannot change role of a partner");
			}
			if (
				UserService.isStaff(currentUser.type) &&
				requestedRole === UserType.PARTNER
			) {
				throw new ArgumentError("Cannot change staff to partner");
			}
		}

		await UserService.updateUser({
			userId: parsed.data.userId,
			name: bodyParsed.data.name,
			email: bodyParsed.data.email,
			type: bodyParsed.data.role,
			tag: bodyParsed.data.tag,
			enabled: bodyParsed.data.enabled,
		});

		return ok();
	} catch (error) {
		return errorResponse(error);
	}
}

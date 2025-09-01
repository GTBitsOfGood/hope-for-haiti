import { auth } from "@/auth";
import UserService from "@/services/userService";
import {
	AuthenticationError,
	AuthorizationError,
	ArgumentError,
	errorResponse,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const paramSchema = z.object({
	userId: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().int().positive("User ID must be a positive integer")),
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

		const user = await UserService.getUserById(parsed.data.userId);

		return NextResponse.json({ user }, { status: 200 });
	} catch (error) {
		return errorResponse(error);
	}
}

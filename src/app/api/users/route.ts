import { auth } from "@/auth";
import { db } from "@/db";
import { authenticationError, authorizationError } from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextResponse } from "next/server";

const ALLOWED_USER_TYPES: UserType[] = [
    UserType.ADMIN,
    UserType.STAFF,
    UserType.SUPER_ADMIN,
];

/**
 * Retrieve a list of all User records.
 * Only accessible to users with STAFF, ADMIN, or SUPER_ADMIN roles.
 *
 * @returns 401 if the request is not authenticated
 * @returns 403 if the user does not have the required role
 * @returns 200 with a list of users, including their email and role type
 */
export async function GET() {
    const session = await auth();
    if (!session?.user) return authenticationError("Session required");

    const { user } = session;
    if (!ALLOWED_USER_TYPES.includes(user.type)) {
        return authorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const users = await db.user.findMany({
        select: {
            email: true,
            type: true,
        },
    });

    return NextResponse.json(users, { status: 200 });
}

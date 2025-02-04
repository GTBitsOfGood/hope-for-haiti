import { auth } from "@/auth";
import { db } from "@/db";
import { argumentError, conflictError, notFoundError, authenticationError, authorizationError, ok } from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { zfd } from "zod-form-data";
import * as argon2 from 'argon2';

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

const schema = zfd.formData({
    inviteToken: zfd.text(),
    password: zfd.text()
});

/**
 * Creates a new User record.
 * Parameters are passed via form data.
 * @param inviteToken Corresponds to token in existing UserInvite record
 * @param password Password for new User account
 * @returns 400 if bad form data or expired UserInvite
 * @returns 404 if UserInvite does not exist
 * @returns 409 if User record for corresponding UserInvite already exists
 * @returns 200
 */
export async function POST(req: NextRequest) {
    const parsed = schema.safeParse(await req.formData());
    if (!parsed.success) {
        return argumentError("Invalid user data");
    }
    
    const { inviteToken, password } = parsed.data;
    const userInvite = await db.userInvite.findUnique({
        where: {
            token: inviteToken
        }
    });
    if (!userInvite) {
        return notFoundError("Invite does not exist");
    } else if (userInvite.expiration < new Date()) {
        return argumentError("Invite has expired");
    }
    try {
        await db.user.create({
            data: {
                email: userInvite.email,
                passwordHash: await argon2.hash(password),
                type: userInvite.userType
            }
        });
    } catch {
        return conflictError("User already exists");
    }
    return ok();
}

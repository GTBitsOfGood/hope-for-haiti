import { db } from "@/db"
import { zfd } from "zod-form-data";
import * as argon2 from 'argon2';
import { NextRequest, NextResponse } from "next/server";
import { argumentError, conflictError, notFoundError } from "@/util/responses";

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
    const existingUser = await db.user.findUnique({
        where: {
            email: userInvite.email
        }
    });
    if (existingUser) {
        return conflictError("User already exists");
    }
    const newUsers = await db.user.create({
        data: {
            email: userInvite.email,
            passwordHash: await argon2.hash(password),
            type: userInvite.userType
        }
    });
    return NextResponse.json(newUsers, {status: 200});
}
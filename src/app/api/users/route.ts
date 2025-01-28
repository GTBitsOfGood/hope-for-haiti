import { auth } from "@/auth";
import { db } from "@/db";
import { internalError, authenticationError, authorizationError, notFoundError } from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session) return authenticationError("Session required");

    const { user } = session;
    if (user.type !== UserType.ADMIN &&
        user.type !== UserType.STAFF &&
        user.type !== UserType.SUPER_ADMIN
        ) {
            return authorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
        }

    const users = await db.user.findMany({
        select: {
            email: true,
            type: true
        }
    });

    if (!users) {
        return notFoundError("User details not found");
    }

    return NextResponse.json(users, { status: 200 });

}
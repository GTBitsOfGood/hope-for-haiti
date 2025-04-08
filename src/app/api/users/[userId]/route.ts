import { auth } from "@/auth";
import { db } from "@/db";
import {
  authenticationError,
  authorizationError,
  argumentError,
} from "@/util/responses";
import { NextRequest, NextResponse } from "next/server";
import { UserType } from "@prisma/client";

const ALLOWED_USER_TYPES: UserType[] = [
  UserType.ADMIN,
  UserType.STAFF,
  UserType.SUPER_ADMIN,
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");
  if (!ALLOWED_USER_TYPES.includes(session.user.type)) {
    return authorizationError("Unauthorized");
  }
  const userIdNum = parseInt((await params).userId);
  if (isNaN(userIdNum)) return argumentError("Partner Id must be an integer");

  const user = await db.user.findUnique({
    where: {
      id: userIdNum,
    },
  });

  return NextResponse.json({
    user,
  });
}

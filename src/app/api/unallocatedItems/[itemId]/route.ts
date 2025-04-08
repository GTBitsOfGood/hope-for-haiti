import { auth } from "@/auth";
import { db } from "@/db";
import { authenticationError, authorizationError, ok } from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextRequest } from "next/server";

const AUTHORIZED_USER_TYPES = [
  UserType.ADMIN,
  UserType.SUPER_ADMIN,
] as UserType[];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");
  if (!AUTHORIZED_USER_TYPES.includes(session.user.type)) {
    return authorizationError("Unauthorized");
  }
  const itemId = parseInt((await params).itemId);

  await db.item.delete({ where: { id: itemId } });

  return ok();
}

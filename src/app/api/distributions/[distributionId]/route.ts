import { auth } from "@/auth";
import { db } from "@/db";
import {
  authenticationError,
  authorizationError,
  argumentError,
  ok,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextRequest } from "next/server";

const AUTHORIZED_USER_TYPES = [
  UserType.ADMIN,
  UserType.SUPER_ADMIN,
] as UserType[];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ distributionId: string }> }
) {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");
  if (!AUTHORIZED_USER_TYPES.includes(session.user.type)) {
    return authorizationError("Unauthorized");
  }
  const distributionIdNum = parseInt((await params).distributionId);
  if (isNaN(distributionIdNum))
    return argumentError("Distribution Id must be an integer");

  await db.distribution.delete({
    where: {
      id: distributionIdNum,
    },
  });

  return ok();
}

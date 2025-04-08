import { auth } from "@/auth";
import { db } from "@/db";
import { authenticationError, authorizationError } from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return authenticationError("Session required");
  }
  if (
    session.user.type !== UserType.STAFF &&
    session.user.type !== UserType.ADMIN &&
    session.user.type !== UserType.SUPER_ADMIN
  ) {
    return authorizationError("Unauthorized");
  }

  const partnerIdNum = parseInt((await params).partnerId);

  const signOffs = await db.signOff.findMany({
    where: { partnerId: partnerIdNum },
    include: {
      distributions: true,
      _count: {
        select: {
          distributions: true,
        },
      },
    },
  });

  return NextResponse.json(
    signOffs.map((signOff) => ({
      staffName: signOff.staffMemberName,
      numberOfItems: signOff._count.distributions,
      dateCreated: signOff.createdAt, // TODO what is this
      signOffDate: signOff.createdAt,
      status: "-",
    })),
  );
}

import { auth } from "@/auth";
import { db } from "@/db";
import {
  argumentError,
  authenticationError,
  notFoundError,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

/**
 * Gets the sign offs for a given partner ID.
 * @param _
 * @param param1
 * @returns
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return authenticationError("User not authenticated");
  }
  if (!session.user) {
    return authenticationError("User not authenticated");
  }

  const partnerUserId = request.nextUrl.searchParams.get("partnerId");
  if (!partnerUserId) return argumentError("Partner user ID is missing");

  const partnerIdNum = parseInt(partnerUserId);
  if (isNaN(partnerIdNum)) return argumentError("Invalid partner user ID");

  const partner = await db.user.findUnique({ where: { id: partnerIdNum } });
  if (!partner || partner.type !== UserType.PARTNER) {
    return argumentError("Partner not found");
  }

  const signOff = await db.signOff.findMany({
    where: { partnerId: partner.id },
    include: { distributions: true },
  });

  if (!signOff) {
    return notFoundError("Sign off not found");
  }

  return NextResponse.json({
    items: signOff,
  });
}

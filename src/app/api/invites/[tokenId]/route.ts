import { db } from "@/db";
import { argumentError } from "@/util/responses";
import { NextRequest, NextResponse } from "next/server";

interface Response {
  email: string;
  name: string;
}

/**
 * Returns the invite with the given token.
 *
 * @param token Token of the invite to find
 *
 * @returns 400 if invite does not exist or is expired
 * @returns {Response} and 200
 */
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params;
  const invite = await db.userInvite.findUnique({
    where: { token: tokenId },
    select: { email: true, name: true, expiration: true },
  });
  if (!invite || invite.expiration < new Date())
    return argumentError("Invalid invite token");

  return NextResponse.json<Response>({
    email: invite.email,
    name: invite.name,
  });
}

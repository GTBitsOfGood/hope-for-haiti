import { auth } from "@/auth";
import { authenticationError, authorizationError } from "@/util/responses";
import { NextResponse } from "next/server";
import { UserType } from "@prisma/client";
import { db } from "@/db";

interface Response {
  partnerEmails: string[];
}

const AUTHORIZED_USER_TYPES = [UserType.SUPER_ADMIN] as UserType[];

/**
 * Retrieves a list of names, emails, and number of unallocated item requests for all partners.
 * @returns 401 if the request is not authenticated
 * @returns 403 if the user is not STAFF, ADMIN, or SUPER_ADMIN
 * @returns 200 and a list of partner names, details, and unallocated item counts
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");
  if (!AUTHORIZED_USER_TYPES.includes(session.user.type))
    return authorizationError("You are not allowed to view this");

  const partners = await db.user.findMany({
    where: { type: UserType.PARTNER },
    select: {
      email: true,
    },
  });

  return NextResponse.json<Response>({
    partnerEmails: partners.map((p) => p.email),
  });
}

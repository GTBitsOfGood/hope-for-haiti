import { auth } from "@/auth";
import { authenticationError, authorizationError } from "@/util/responses";
import { NextResponse } from "next/server";
import { UserType } from "@prisma/client";
import { db } from "@/db";

interface PartnersResponse {
  partners: {
    id: number;
    name: string;
    email: string;
    unallocatedItemRequestCount: number;
  }[];
}

const AUTHORIZED_USER_TYPES = [
  UserType.STAFF,
  UserType.ADMIN,
  UserType.SUPER_ADMIN,
] as UserType[];

/**
 * Retrieves a list of names, emails, and number of unallocated item requests for all partners.
 * @returns 401 if the request is not authenticated
 * @returns 403 if the user is not STAFF, ADMIN, or SUPER_ADMIN
 * @returns 200 and a list of partner names, details, and unallocated item counts
 */
export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");
  if (!AUTHORIZED_USER_TYPES.includes(session.user.type)) {
    return authorizationError("You are not allowed to view this");
  }
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term");
  
  if (term) {
    const partners = await db.user.findMany({
      where: {
        type: UserType.PARTNER,
        name: { 
          contains: term,
          mode: 'insensitive'
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
    return NextResponse.json({
      partners: partners.map((partner) => ({
        id: partner.id,
        name: partner.name,
      })),
    });
  }

  const partners = await db.user.findMany({
    where: { type: UserType.PARTNER },
    select: {
      email: true,
      name: true,
      _count: {
        select: { unallocatedItemRequests: true },
      },
    },
  });

  return NextResponse.json({
    partners: partners.map((partner) => ({
      name: partner.name,
      email: partner.email,
      unallocatedItemRequestCount: partner._count.unallocatedItemRequests,
    })),
  } as PartnersResponse);
}

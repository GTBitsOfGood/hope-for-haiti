import { auth } from "@/auth";
import { db } from "@/db";
import { authenticationError, authorizationError, ok } from "@/util/responses";
import { RequestPriority, UserType } from "@prisma/client";
import { NextRequest } from "next/server";

interface Request {
  id: number;
  priority: RequestPriority;
  quantity: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return authenticationError("Session required");
  if (!session?.user) return authenticationError("User not found");
  if (session.user.type !== UserType.PARTNER)
    return authorizationError("User must be a partner");

  const reqBody: Request = await req.json();
  await db.unallocatedItemRequest.update({
    where: {
      id: reqBody.id,
    },
    data: {
      priority: reqBody.priority,
      quantity: parseInt(reqBody.quantity),
    },
  });

  return ok();
}

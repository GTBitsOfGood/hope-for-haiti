import { auth } from "@/auth";
import { errorResponse, ok } from "@/util/errors";
import { UnallocatedItemService } from "@/services/unallocatedItemService";
import { AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import { UserType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { RequestPriority } from "@prisma/client";

const createMultipleRequestsSchema = z.array(z.object({
  generalItem: z.object({
    title: z.string(),
    type: z.string(),
    expirationDate: z.string(),
    unitType: z.string(),
    quantityPerUnit: z.number(),
  }),
  priority: z.nativeEnum(RequestPriority),
  quantity: z.string(),
  comments: z.string(),
}));

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (session.user.type !== UserType.PARTNER) {
      throw new AuthorizationError("User must be a partner");
    }

    const reqBody = await req.json();
    const parsed = createMultipleRequestsSchema.safeParse(reqBody);
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    await UnallocatedItemService.createMultipleUnallocatedItemRequests({
      requests: parsed.data,
      partnerId: parseInt(session.user.id),
    });

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (session.user.type !== UserType.PARTNER) {
      throw new AuthorizationError("User must be a partner");
    }

    const requests = await UnallocatedItemService.getPartnerUnallocatedItemRequests(
      parseInt(session.user.id)
    );

    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

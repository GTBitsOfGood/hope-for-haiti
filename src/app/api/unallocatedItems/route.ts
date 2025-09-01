/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth } from "@/auth";
import { errorResponse, ok } from "@/util/errors";
import { UnallocatedItemService } from "@/services/unallocatedItemService";
import { AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import { parseDateIfDefined } from "@/util/util";
import { RequestPriority, UserType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zfd } from "zod-form-data";

const createUnallocatedItemRequestSchema = zfd.formData({
  title: zfd.text(),
  type: zfd.text(),
  priority: zfd.text(z.nativeEnum(RequestPriority)),
  expirationDate: z.coerce.date().optional(),
  unitType: zfd.text(),
  quantityPerUnit: zfd.numeric(z.number().int()),
  quantity: zfd.numeric(z.number().int().min(1)),
  comments: zfd.text(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const params = request.nextUrl.searchParams;
    const expirationDateBefore = parseDateIfDefined(
      params.get("expirationDateBefore")
    );
    const expirationDateAfter = parseDateIfDefined(
      params.get("expirationDateAfter")
    );

    if (expirationDateBefore === null) {
      throw new ArgumentError("expirationDateBefore must be a valid ISO-8601 timestamp");
    }

    if (expirationDateAfter === null) {
      throw new ArgumentError("expirationDateAfter must be a valid ISO-8601 timestamp");
    }

    const result = await UnallocatedItemService.getUnallocatedItems({
      expirationDateBefore,
      expirationDateAfter,
      userType: session.user.type,
      userId: session.user.id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (session.user.type !== UserType.PARTNER) {
      throw new AuthorizationError("User must be a partner");
    }

    const parsed = createUnallocatedItemRequestSchema.safeParse(await req.formData());
    if (!parsed.success) {
      throw new ArgumentError("Invalid form data");
    }

    await UnallocatedItemService.createUnallocatedItemRequest({
      ...parsed.data,
      partnerId: parseInt(session.user.id),
    });

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

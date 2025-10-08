import { auth } from "@/auth";
import { isAdmin } from "@/lib/userUtils";
import {
  LineItemService,
  singleLineItemSchema,
} from "@/services/lineItemService";
import {
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";

const updateSchema = singleLineItemSchema.partial();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lineItemId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!isAdmin(session.user.type)) {
      throw new AuthorizationError("Must be ADMIN");
    }

    const { lineItemId } = await params;
    const form = await request.formData();

    const data = Object.fromEntries(
      form.entries().map(([key, value]) => [key, value ?? undefined])
    );
    const parsed = updateSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(parsed.error.message);
    }

    const updatedItem = await LineItemService.updateLineItem(
      Number(lineItemId),
      parsed.data
    );

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ lineItemId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!isAdmin(session.user.type)) {
      throw new AuthorizationError("Must be ADMIN");
    }

    const { lineItemId } = await params;

    await LineItemService.deleteLineItem(Number(lineItemId));

    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

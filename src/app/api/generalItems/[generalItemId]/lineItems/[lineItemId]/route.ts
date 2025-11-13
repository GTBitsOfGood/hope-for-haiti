import { auth } from "@/auth";
import {
  LineItemService,
  singleLineItemSchema,
} from "@/services/lineItemService";
import UserService from "@/services/userService";
import {
  AuthenticationError,
  errorResponse,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { formDataToObject } from "@/util/formData";

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

    UserService.checkPermission(session.user, "offerWrite");

    const { lineItemId } = await params;
    const form = await request.formData();

    const data = formDataToObject(form);
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

    UserService.checkPermission(session.user, "offerWrite");

    const { lineItemId } = await params;

    await LineItemService.deleteLineItem(Number(lineItemId));

    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

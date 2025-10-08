import { auth } from "@/auth";
import { isAdmin } from "@/lib/userUtils";
import { lineItemFormSchema } from "@/schema/itemForm";
import { LineItemService } from "@/services/lineItemService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ generalItemId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!isAdmin(session.user.type)) {
      throw new AuthorizationError("You are not allowed to view items");
    }

    const { generalItemId } = await params;

    const items = await LineItemService.getLineItemsForGeneralItem(
      Number(generalItemId)
    );

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ generalItemId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!isAdmin(session.user.type)) {
      throw new AuthenticationError("You are not allowed to create items");
    }

    const { generalItemId } = await params;
    const form = await request.formData();
    const data = Object.fromEntries(form.entries());

    const parsed = lineItemFormSchema.safeParse(data);
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const newItem = await LineItemService.createItem(
      parsed.data,
      Number(generalItemId)
    );

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

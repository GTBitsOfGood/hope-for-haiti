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
import { tableParamsSchema } from "@/schema/tableParams";
import { formDataToObject } from "@/util/formData";

export async function GET(
  request: NextRequest,
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
    const parsedParams = tableParamsSchema.safeParse({
      filters: request.nextUrl.searchParams.get("filters"),
      page: request.nextUrl.searchParams.get("page"),
      pageSize: request.nextUrl.searchParams.get("pageSize"),
    });

    if (!parsedParams.success) {
      throw new ArgumentError(parsedParams.error.message);
    }

    const { filters, page, pageSize } = parsedParams.data;

    const result = await LineItemService.getLineItemsForGeneralItem(
      Number(generalItemId),
      filters ?? undefined,
      page ?? undefined,
      pageSize ?? undefined
    );

    return NextResponse.json(result);
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
    const data = formDataToObject(form);

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

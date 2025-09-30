import { auth } from "@/auth";
import { errorResponse } from "@/util/errors";
import { ItemService } from "@/services/itemService";
import { AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import { NextResponse, NextRequest } from "next/server";
import { ItemFormSchema } from "@/schema/itemForm";
import UserService from "@/services/userService";
import { tableParamsSchema } from "@/schema/tableParams";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Must be ADMIN or SUPER_ADMIN");
    }

    const validatedForm = ItemFormSchema.safeParse(await request.formData());

    if (!validatedForm.success) {
      throw new ArgumentError(validatedForm.error.message);
    }

    const createdItem = await ItemService.createItem(validatedForm.data);

    return NextResponse.json(createdItem, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Must be ADMIN or SUPER_ADMIN");
    }

    const parsed = tableParamsSchema.safeParse({
      filters: request.nextUrl.searchParams.get("filters"),
      page: request.nextUrl.searchParams.get("page"),
      pageSize: request.nextUrl.searchParams.get("pageSize"),
      includeInvites: request.nextUrl.searchParams.get("includeInvites"),
    });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { filters, page, pageSize } = parsed.data;

    const { items, total } = await ItemService.getAllItems(
      filters ?? undefined,
      page ?? undefined,
      pageSize ?? undefined
    );
    return NextResponse.json({items, total}, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

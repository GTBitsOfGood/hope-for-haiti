import { auth } from "@/auth";
import { errorResponse } from "@/util/errors";
import { ItemService } from "@/services/itemService";
import { AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import { NextResponse, NextRequest } from "next/server";
import { ItemFormSchema } from "@/schema/itemForm";
import UserService from "@/services/userService";

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

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Must be ADMIN or SUPER_ADMIN");
    }

    const items = await ItemService.getAllItems();
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

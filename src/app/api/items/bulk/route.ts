import { auth } from "@/auth";
import { errorResponse } from "@/util/errors";
import { ItemService } from "@/services/itemService";
import { AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import UserService from "@/services/userService";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Must be ADMIN or SUPER_ADMIN");
    }

    const url = new URL(request.url);
    const preview = url.searchParams.get("preview") === "true";
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new ArgumentError("No file provided");
    }

    const result = await ItemService.processBulkUpload(file, preview);

    if (!result.success) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

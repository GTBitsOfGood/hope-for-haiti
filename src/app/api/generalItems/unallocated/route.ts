import { auth } from "@/auth";
import { isAdmin } from "@/lib/userUtils";
import { GeneralItemService } from "@/services/generalItemService";
import {
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!isAdmin(session.user.type)) {
      throw new AuthorizationError(
        "You are not allowed to view unallocated items"
      );
    }

    const unallocatedItems = await GeneralItemService.getUnallocatedItems();

    return NextResponse.json(unallocatedItems, {
      status: 200,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

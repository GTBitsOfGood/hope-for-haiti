import { auth } from "@/auth";
import { isAdmin } from "@/lib/userUtils";
import { WishlistService } from "@/services/wishlistService";
import {
  AuthorizationError,
  AuthenticationError,
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
      throw new AuthorizationError("Admin access required");
    }

    const summary = await WishlistService.summarizeWishlists();

    return NextResponse.json({
      summary,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

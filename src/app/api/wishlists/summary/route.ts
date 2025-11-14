import { auth } from "@/auth";
import UserService from "@/services/userService";
import { WishlistService } from "@/services/wishlistService";
import {
  AuthorizationError,
  AuthenticationError,
  errorResponse,
} from "@/util/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user)) {
      throw new AuthorizationError("Staff access required");
    }

    UserService.checkPermission(session.user, "wishlistRead");

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of WishlistService.streamWishlistSummary()) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (error) {
          console.error("Error streaming wishlist summary:", error);
          controller.enqueue(
            encoder.encode("Error generating summary.")
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

import { auth } from "@/auth";
import { isAdmin } from "@/lib/userUtils";
import { GeneralItemService } from "@/services/generalItemService";
import {
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";

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

    return new Response(JSON.stringify(unallocatedItems), {
      status: 200,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

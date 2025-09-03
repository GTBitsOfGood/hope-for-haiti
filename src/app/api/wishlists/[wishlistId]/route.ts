import { updateWishlistSchema } from "@/schema/wishlist";
import UserService from "@/services/userService";
import { WishlistService } from "@/services/wishlistService";
import { ArgumentError, errorResponse, ok } from "@/util/errors";
import { $Enums } from "@prisma/client";
import { NextRequest } from "next/server";

/**
 * Updates a wishlist item. Allows changes to name, unit size, quantity, priority, and comments.
 * @param req
 * @returns
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ wishlistId: string }> }
) {
  try {
    const session = await UserService.authRequirePartner();

    const { wishlistId } = await params;
    const body = await req.json();

    const parsed = updateWishlistSchema.safeParse(body);
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const wishlistItem = await WishlistService.getWishlistItem(
      Number(wishlistId)
    );

    // Check ID first to avoid revealing the existence/non-existence of the wishlist item to an unauthorized user
    if (wishlistItem?.partnerId !== Number(session.user.id)) {
      throw new ArgumentError("Cannot update wishlist item");
    }

    if (!wishlistItem) {
      throw new ArgumentError("Wishlist item not found");
    }

    await WishlistService.updateWishlist({
      ...parsed.data,
      id: Number(wishlistId),
      priority: parsed.data.priority as $Enums.RequestPriority,
    });

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

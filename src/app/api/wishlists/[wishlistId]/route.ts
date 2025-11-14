import { auth } from "@/auth";
import { idSchema, updateWishlistSchema } from "@/schema/wishlist";
import UserService from "@/services/userService";
import { WishlistService } from "@/services/wishlistService";
import { ArgumentError, errorResponse, ok } from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { User } from "next-auth";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ wishlistId: string }> }
) {
  try {
    const session = await auth();

    if (!UserService.isPartner(session?.user as User)) {
      throw new ArgumentError("Must be PARTNER");
    }

    const parsedId = idSchema.safeParse((await params).wishlistId);
    if (!parsedId.success) {
      throw new ArgumentError("Invalid wishlist ID");
    }

    const wishlistId = parsedId.data;
    const wishlistItem = await WishlistService.getWishlistItem(wishlistId);

    // Check ID first to avoid revealing the existence/non-existence of the wishlist item to an unauthorized user
    if (wishlistItem?.partnerId !== Number(session!.user.id)) {
      throw new ArgumentError("Wishlist item not found");
    }

    if (!wishlistItem) {
      throw new ArgumentError("Wishlist item not found");
    }

    return NextResponse.json(wishlistItem);
  } catch (error) {
    return errorResponse(error);
  }
}

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
    const session = await auth();

    if (!UserService.isPartner(session?.user as User)) {
      throw new ArgumentError("Must be PARTNER");
    }

    const parsedId = idSchema.safeParse((await params).wishlistId);
    if (!parsedId.success) {
      throw new ArgumentError("Invalid wishlist ID");
    }

    const wishlistId = parsedId.data;
    const body = await req.json();

    const parsed = updateWishlistSchema.safeParse(body);
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const wishlistItem = await WishlistService.getWishlistItem(wishlistId);

    // Check ID first to avoid revealing the existence/non-existence of the wishlist item to an unauthorized user
    if (wishlistItem?.partnerId !== Number(session!.user.id)) {
      throw new ArgumentError("Cannot update another partner's wishlist item");
    }

    if (!wishlistItem) {
      throw new ArgumentError("Wishlist item not found");
    }

    await WishlistService.updateWishlist({
      id: Number(wishlistId),
      ...parsed.data,
    });

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ wishlistId: string }> }
) {
  try {
    const session = await auth();

    if (!UserService.isPartner(session?.user as User)) {
      throw new ArgumentError("Must be PARTNER");
    }

    const parsedId = idSchema.safeParse((await params).wishlistId);
    if (!parsedId.success) {
      throw new ArgumentError(parsedId.error.message);
    }

    const wishlistId = parsedId.data;
    const wishlistItem = await WishlistService.getWishlistItem(wishlistId);

    // Check ID first to avoid revealing the existence/non-existence of the wishlist item to an unauthorized user
    if (wishlistItem?.partnerId !== Number(session!.user.id)) {
      throw new ArgumentError("Cannot delete another partner's wishlist item");
    }

    if (!wishlistItem) {
      throw new ArgumentError("Wishlist item not found");
    }

    await WishlistService.deleteWishlist(Number(wishlistId));

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

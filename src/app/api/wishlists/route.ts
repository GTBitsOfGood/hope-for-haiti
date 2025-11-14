import { auth } from "@/auth";
import { tableParamsSchema } from "@/schema/tableParams";
import { createWishlistSchema, idSchema } from "@/schema/wishlist";
import UserService from "@/services/userService";
import { WishlistService } from "@/services/wishlistService";
import { CreateWishlistData } from "@/types/api/wishlist.types";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
  ok,
} from "@/util/errors";
import { $Enums } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isPartner(session.user)) {
      throw new ArgumentError("Must be PARTNER");
    }

    const body = await req.json();
    const result = createWishlistSchema.safeParse(body);
    if (!result.success) {
      throw new ArgumentError(result.error.message);
    }

    const wishlist: CreateWishlistData = {
      ...result.data,
      partnerId: Number(session.user.id),
      priority: result.data.priority as $Enums.RequestPriority,
    };

    await WishlistService.createWishlist(wishlist);

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const parsedPartnerId = idSchema
      .optional()
      .nullable()
      .safeParse(req.nextUrl.searchParams.get("partnerId"));

    if (!parsedPartnerId.success) {
      throw new ArgumentError(parsedPartnerId.error.message);
    }
    let partnerId = parsedPartnerId.data;

    // Only let partners see their own wishlists. Default partnerId to their own
    if (UserService.isPartner(session.user)) {
      if (partnerId && partnerId !== Number(session.user.id)) {
        throw new AuthenticationError(
          "Cannot access wishlists for other partners"
        );
      }

      partnerId = Number(session.user.id);
    }

    if (partnerId) {
      const wishlists = await WishlistService.getWishlistsByPartner(partnerId);
      return NextResponse.json(wishlists, {
        status: 200,
      });
    }

    UserService.checkPermission(session.user, "wishlistRead");

    const parsedParams = tableParamsSchema.safeParse({
      filters: req.nextUrl.searchParams.get("filters"),
      page: req.nextUrl.searchParams.get("page"),
      pageSize: req.nextUrl.searchParams.get("pageSize"),
    });

    if (!parsedParams.success) {
      throw new ArgumentError(parsedParams.error.message);
    }

    const { filters, page, pageSize } = parsedParams.data;

    const wishlists = await WishlistService.getAllWishlists(
      filters ?? undefined,
      page ?? undefined,
      pageSize ?? undefined
    );

    return NextResponse.json(wishlists);
  } catch (error) {
    return errorResponse(error);
  }
}

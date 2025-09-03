import { auth } from "@/auth";
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
import { z } from "zod";

const postParamSchema = z.object({
  name: z.string().min(3).max(100),
  unitSize: z.string().min(2).max(100),
  quantity: z.number().min(1),
  priority: z.enum(
    Object.values($Enums.RequestPriority) as [string, ...string[]]
  ),
  comments: z.string().max(500),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (session.user.type !== $Enums.UserType.PARTNER) {
      throw new AuthenticationError("Must be PARTNER");
    }

    const body = await req.json();
    const result = postParamSchema.safeParse(body);
    if (!result.success) {
      throw new ArgumentError(result.error.message);
    }

    // Request is valid

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

    let partnerId = Number(new URL(req.url).searchParams.get("partnerId"));

    // Only let partners see their own wishlists. Default partnerId to their own
    if (session.user.type === $Enums.UserType.PARTNER) {
      if (partnerId && partnerId !== Number(session.user.id)) {
        throw new AuthenticationError(
          "Cannot access wishlists for other partners"
        );
      }

      partnerId = Number(session.user.id);
    }

    if (partnerId) {
      if (Number.isNaN(partnerId)) {
        throw new ArgumentError("partnerId must be a number");
      }

      if (partnerId <= 0) {
        throw new ArgumentError("partnerId must be a positive number");
      }

      const wishlists = await WishlistService.getWishlistsByPartner(partnerId);
      return NextResponse.json(wishlists, {
        status: 200,
      });
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthenticationError("Must be staff");
    }

    const stats = await WishlistService.getWishlistsStatsByPartner();
    return NextResponse.json(stats, {
      status: 200,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

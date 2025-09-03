import { auth } from "@/auth";
import { WishlistService } from "@/services/wishlistService";
import { CreateWishlistData } from "@/types/api/wishlist.types";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
  ok,
} from "@/util/errors";
import { $Enums } from "@prisma/client";
import { NextRequest } from "next/server";
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

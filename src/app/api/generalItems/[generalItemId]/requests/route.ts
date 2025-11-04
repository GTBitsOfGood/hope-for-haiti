import { auth } from "@/auth";
import { isPartner } from "@/lib/userUtils";
import { GeneralItemRequestService } from "@/services/generalItemRequestService";
import { WishlistService } from "@/services/wishlistService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { $Enums } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { tableParamsSchema } from "@/schema/tableParams";

const createSchema = z.object({
  generalItemId: z.number().int().positive(),
  partnerId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  comments: z.string().max(255).optional(),
  priority: z
    .enum(Object.values($Enums.RequestPriority) as [string, ...string[]])
    .transform((val) => val as $Enums.RequestPriority),
  removeFromWishlist: z.boolean().optional(),
  wishlistId: z.number().int().positive().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ generalItemId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const { generalItemId } = await params;
    const parsedParams = tableParamsSchema.safeParse({
      filters: request.nextUrl.searchParams.get("filters"),
      page: request.nextUrl.searchParams.get("page"),
      pageSize: request.nextUrl.searchParams.get("pageSize"),
    });

    if (!parsedParams.success) {
      throw new ArgumentError(parsedParams.error.message);
    }

    const { filters, page, pageSize } = parsedParams.data;

    const requests = await GeneralItemRequestService.getRequestsByGeneralItemId(
      parseInt(generalItemId),
      filters ?? undefined,
      page ?? undefined,
      pageSize ?? undefined
    );

    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ generalItemId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!isPartner(session.user.type)) {
      throw new AuthorizationError("Partner access required");
    }

    const { generalItemId } = await params;

    const formData = await request.formData();

    const parsedData = createSchema.safeParse({
      generalItemId: parseInt(generalItemId),
      partnerId: parseInt(session.user.id),
      quantity: formData.get("quantity") ? parseInt(formData.get("quantity") as string) : undefined,
      priority: formData.get("priority") ? formData.get("priority") as string : undefined,
      comments: formData.get("comments") ? formData.get("comments") as string : undefined,
      removeFromWishlist: formData.get("removeFromWishlist") === "true",
      wishlistId: formData.get("wishlistId") ? parseInt(formData.get("wishlistId") as string) : undefined,
    });

    if (!parsedData.success) {
      throw new Error(parsedData.error.message);
    }

    const itemRequest = await GeneralItemRequestService.createRequest(
      parsedData.data
    );

    // Link wishlist to general item if requested
    if (parsedData.data.removeFromWishlist && parsedData.data.wishlistId) {
      await WishlistService.linkWishlistToGeneralItem(
        parsedData.data.wishlistId,
        parsedData.data.generalItemId
      );
    }

    return NextResponse.json({
      requestId: itemRequest.id,
      ...itemRequest
    }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}


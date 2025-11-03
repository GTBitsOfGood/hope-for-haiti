import { auth } from "@/auth";
import { GeneralItemService } from "@/services/generalItemService";
import { singleLineItemSchema } from "@/services/lineItemService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { tableParamsSchema } from "@/schema/tableParams";
import { isPartner } from "@/lib/userUtils";
import { MatchingService } from "@/services/matchingService";
import { WishlistService } from "@/services/wishlistService";

const postSchema = z.object({
  donorOfferId: z.number().int().positive(),
  title: z.string().min(1).max(255),
  type: z.string().min(1).max(255),
  expirationDate: z
    .string()
    .transform((date) => new Date(date))
    .optional(),
  unitType: z.string().min(1).max(255),
  quantityPerUnit: z.number().int().positive(),
  initialQuantity: z.number().int().min(0),
  requestQuantity: z.number().int().min(0).optional(),
  lineItem: z.array(singleLineItemSchema).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError(
        "You are not allowed to create donor offers"
      );
    }

    const form = await request.formData();
    const obj = {
      donorOfferId: Number(form.get("donorOfferId")),
      title: form.get("title") as string,
      type: form.get("type") as string,
      expirationDate:
        form.get("expirationDate") ?? (undefined as string | undefined),
      unitType: form.get("unitType") as string,
      quantityPerUnit: Number(form.get("quantityPerUnit")),
      initialQuantity: Number(form.get("initialQuantity")),
      requestQuantity: form.get("requestQuantity")
        ? Number(form.get("requestQuantity"))
        : undefined,
      lineItem: form.get("lineItem")
        ? JSON.parse(form.get("lineItem") as string)
        : undefined,
    };
    const parsed = postSchema.safeParse(obj);

    if (!parsed.success) throw new ArgumentError(parsed.error.message);

    const data = parsed.data;

    const createdItem = await GeneralItemService.createGeneralItem(data);
    await MatchingService.add(createdItem);

    return NextResponse.json(createdItem, {
      status: 201,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }
    if (!isPartner(session.user.type)) {
      throw new AuthorizationError(
        "You are not allowed to view available items"
      );
    }

    const parsedParams = tableParamsSchema.safeParse({
      filters: request.nextUrl.searchParams.get("filters"),
      page: request.nextUrl.searchParams.get("page"),
      pageSize: request.nextUrl.searchParams.get("pageSize"),
    });
    if (!parsedParams.success) {
      throw new ArgumentError(parsedParams.error.message);
    }
    const { filters, page, pageSize } = parsedParams.data;

    // 1) Get user wishlists
    const wishlists = await WishlistService.getWishlistsByPartner(
      parseInt(session.user.id)
    );

    // 2) Compute matches (k=1 per wishlist, your thresholds)
    const matches = await MatchingService.getTopKMatches({
      queries: wishlists.map((w) => w.name),
      k: 1,
      distanceCutoff: 0.6,
      hardCutoff: 0.2,
    });

    // 3) Build a Set of matched ids
    const matchedIds = new Set<number>();
    for (const matchList of matches) {
      for (const match of matchList) {
        matchedIds.add(Number(match.id));
      }
    }

    // 4) Fetch ALL items (unpaginated), keeping existing filters
    //    We will do the "move matched first" + paginate locally.
    //    Potential performance issues here but simplifies logic greatly.
    const allItems = await GeneralItemService.getAvailableItemsForPartner(
      parseInt(session.user.id),
      filters ?? undefined,
      /* page */ undefined,
      /* pageSize */ undefined
    );

    // 5) Stable partition: matched first (preserve original order), then the rest
    const matched = [];
    const rest = [];
    for (const item of allItems.items) {
      if (matchedIds.has(Number(item.id))) matched.push(item);
      else rest.push(item);
    }
    const ordered = matched.concat(rest);

    // 6) Paginate the ordered list
    const p = Math.max(1, Number(page ?? 1));
    const ps = Math.max(1, Number(pageSize ?? 25));
    const start = (p - 1) * ps;
    const end = start + ps;

    const paged = ordered.slice(start, end);
    const total = ordered.length;

    // 7) Return in standard table shape (data + total)
    return NextResponse.json(
      {
        items: paged,
        total,
        page: p,
        pageSize: ps,
      },
      { status: 200 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

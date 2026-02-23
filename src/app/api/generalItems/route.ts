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
import { MatchingService } from "@/services/matchingService";
import { WishlistService } from "@/services/wishlistService";
import DonorOfferService from "@/services/donorOfferService";

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
  weight: z.number().min(0, "Weight must be non-negative"),
  lineItem: z.array(singleLineItemSchema).optional(),
});

const getSchema = tableParamsSchema.extend({
  initialItems: z
    .string()
    .transform((s) => {
      try {
        const parsed = JSON.parse(s.trim());
        if (Array.isArray(parsed)) return parsed.map((id) => Number(id));
        return [];
      } catch {
        return [];
      }
    })
    .optional(),
  donorOfferId: z
    .string()
    .transform((s) => {
      const id = Number(s);
      if (isNaN(id)) {
        return null;
      }
      return id;
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "offerWrite");

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
      weight: Number(form.get("weight")),
      lineItem: form.get("lineItem")
        ? JSON.parse(form.get("lineItem") as string)
        : undefined,
    };
    const parsed = postSchema.safeParse(obj);

    if (!parsed.success) throw new ArgumentError(parsed.error.message);

    const data = parsed.data;

    const createdItem = await GeneralItemService.createGeneralItem(data);
    await MatchingService.add({
      generalItemId: createdItem.id,
      donorOfferId: createdItem.donorOfferId,
      title: createdItem.title,
    });

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
    if (!UserService.isPartner(session.user)) {
      throw new AuthorizationError(
        "You are not allowed to view available items"
      );
    }

    const parsedParams = getSchema.safeParse({
      filters: request.nextUrl.searchParams.get("filters"),
      page: request.nextUrl.searchParams.get("page"),
      pageSize: request.nextUrl.searchParams.get("pageSize"),
      initialItems:
        request.nextUrl.searchParams.get("initialItems") || undefined,
      donorOfferId:
        request.nextUrl.searchParams.get("donorOfferId") || undefined,
    });
    if (!parsedParams.success) {
      throw new ArgumentError(parsedParams.error.message);
    }
    const { filters, page, pageSize, initialItems, donorOfferId } =
      parsedParams.data;

    const wishlists = await WishlistService.getWishlistsByPartner(
      parseInt(session.user.id)
    );

    const matches = await MatchingService.getTopKMatches({
      queries: wishlists.map((w) => w.name),
      k: 4,
    });

    const matchedIds: number[] = [];
    const matchMetadata = new Map<
      number,
      {
        wishlistId: number;
        wishlistTitle: string;
        strength: "hard" | "soft";
        distance: number;
      }
    >();

    for (let i = 0; i < matches.length; i++) {
      const matchList = matches[i];
      const wishlist = wishlists[i];

      for (const match of matchList) {
        const id = Number(match.id);

        if (!matchedIds.includes(id)) {
          matchedIds.push(id);
        }

        const existing = matchMetadata.get(id);
        const shouldUpdate =
          !existing ||
          (match.strength === "hard" && existing.strength === "soft") ||
          (match.strength === existing.strength &&
            match.distance < existing.distance);

        if (shouldUpdate) {
          matchMetadata.set(id, {
            wishlistId: wishlist.id,
            wishlistTitle: wishlist.name,
            strength: match.strength,
            distance: match.distance,
          });
        }
      }
    }

    const priorityIds = initialItems ?? [];

    if (donorOfferId) {
      const offer =
        await DonorOfferService.getDonorOfferGeneralItemIds(donorOfferId);
      if (offer) {
        offer.items.forEach((item) => {
          if (!priorityIds.includes(item.id)) {
            priorityIds.push(item.id);
          }
        });
      }
    }

    if (priorityIds.length > 0) {
      for (const id of matchedIds) {
        if (!priorityIds.includes(id)) {
          priorityIds.push(id);
        }
      }
    }

    const result = await GeneralItemService.getAvailableItemsForPartner(
      parseInt(session.user.id),
      filters ?? undefined,
      page ?? undefined,
      pageSize ?? undefined,
      priorityIds.length > 0 ? priorityIds : undefined
    );

    const enrichedItems = result.items.map((item) => {
      const matchInfo = matchMetadata.get(item.id);
      return {
        ...item,
        wishlistMatch: matchInfo
          ? {
              wishlistId: matchInfo.wishlistId,
              wishlistTitle: matchInfo.wishlistTitle,
              strength: matchInfo.strength,
            }
          : null,
      };
    });

    return NextResponse.json(
      {
        items: enrichedItems,
        total: result.total,
      },
      { status: 200 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

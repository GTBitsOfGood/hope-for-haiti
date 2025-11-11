import { db } from "@/db";
import { getOpenAIClient } from "@/lib/azureOpenAI";
import { Filters } from "@/types/api/filter.types";
import {
  CreateWishlistData,
  UpdateWishlistData,
} from "@/types/api/wishlist.types";
import { NotFoundError, ArgumentError } from "@/util/errors";
import { buildWhereFromFilters } from "@/util/table";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export class WishlistService {
  static async createWishlist(data: CreateWishlistData) {
    // Check if the partner is enabled and not pending
    const partner = await db.user.findUnique({
      where: { id: data.partnerId },
      select: { enabled: true, pending: true },
    });

    if (!partner) {
      throw new NotFoundError("Partner not found");
    }

    if (!partner.enabled) {
      throw new ArgumentError("Cannot create wishlist for deactivated partner");
    }

    if (partner.pending) {
      throw new ArgumentError("Cannot create wishlist for pending partner");
    }

    await db.wishlist.create({
      data,
    });
  }

  /**
   * Automatically updates lastUpdated
   */
  static async updateWishlist(data: UpdateWishlistData) {
    try {
      await db.wishlist.update({
        where: {
          id: data.id,
        },
        data,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("Unallocated item request not found");
        }
      }
      throw error;
    }
  }

  static async deleteWishlist(id: number) {
    await db.wishlist.delete({
      where: {
        id,
      },
    });
  }

  static async linkWishlistToGeneralItem(
    wishlistId: number,
    generalItemId: number
  ) {
    try {
      await db.wishlist.update({
        where: {
          id: wishlistId,
        },
        data: {
          generalItemId: generalItemId,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("Wishlist not found");
        }
      }
      throw error;
    }
  }

  static async getWishlistItem(id: number) {
    return await db.wishlist.findUnique({
      where: {
        id,
      },
    });
  }

  static async getWishlistsByPartner(partnerId: number) {
    // Check if the partner is enabled and not pending
    const partner = await db.user.findUnique({
      where: { id: partnerId },
      select: { enabled: true, pending: true },
    });

    if (!partner?.enabled || partner?.pending) {
      return [];
    }

    return await db.wishlist.findMany({
      where: {
        generalItemId: null,
        partnerId,
      },
    });
  }

  static async getAllWishlists(
    filters?: Filters,
    page?: number,
    pageSize?: number
  ) {
    const filterWhere = buildWhereFromFilters<Prisma.WishlistWhereInput>(
      Object.keys(Prisma.WishlistScalarFieldEnum),
      filters
    );

    const query = {
      where: filterWhere,
      skip: page && pageSize ? (page - 1) * pageSize : undefined,
      take: pageSize ?? undefined,
      include: {
        partner: true,
      },
    };

    const [wishlists, total] = await Promise.all([
      db.wishlist.findMany(query),
      db.wishlist.count({ where: filterWhere }),
    ]);

    return {
      wishlists,
      total,
    };
  }

  static async getUnfulfilledWishlists() {
    return await db.wishlist.findMany({
      where: {
        generalItemId: null,
      },
    });
  }

  static async summarizeWishlists() {
    const wishlists = await this.getUnfulfilledWishlists();

    if (wishlists.length < 10) {
      return "";
    }

    const { client } = getOpenAIClient();
    if (!client) {
      throw new Error("OpenAI client not configured");
    }

    const systemPrompt = `You are an expert at summarizing lists of items into concise summaries. 
        Given a list of wishlists with their names and priorities, generate a brief summary highlighting 
        key themes, common items, and overall trends. Keep the summary under 100 words.`;

    const userPrompt = `Here is the list of unfulfilled wishlists:\n${wishlists
      .map(
        (w) =>
          `- ${w.name} (Priority: ${w.priority.toLowerCase()}, Quantity: ${w.quantity}, Comments: ${w.comments || "None"})`
      )
      .join("\n")}\n\nPlease provide a concise summary.`;

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "omni-moderate",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const summary = response.choices[0]?.message?.content || "";
    return summary;
  }
}

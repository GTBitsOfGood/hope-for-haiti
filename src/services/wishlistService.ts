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
import { MatchingService } from "./matchingService";

export class WishlistService {
  static async createWishlist(data: CreateWishlistData) {
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

    const wishlist = await db.wishlist.create({
      data,
    });

    await MatchingService.add({
      wishlistId: wishlist.id,
      title: wishlist.name,
    });

    return wishlist;
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

    await MatchingService.remove({ wishlistIds: [id] });
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

      await MatchingService.remove({ wishlistIds: [wishlistId] });
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
      include: {
        partner: true,
      }, // added for AI recognition
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

    const systemPrompt = `Summarize wishlists in under 75 words using this structure: (1) Overall trend/theme across all items. (2) High priority items summary. (3) Medium priority items summary. (4) Low priority items summary. Adapt structure if priorities are disproportionate (e.g., skip sentences for missing priorities). Maximum 4 sentences. Be extremely concise and comprehensible.`;

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

  static async *streamWishlistSummary() {
    const wishlists = await this.getUnfulfilledWishlists();

    if (wishlists.length === 0) {
      yield "No wishlist items";
      return;
    }

    if (wishlists.length < 10) {
      yield "Not enough wishlist items to generate a summary";
      return;
    } // implemented #265

    const { client } = getOpenAIClient();
    if (!client) {
      throw new Error("OpenAI client not configured");
    }

    const systemPrompt = `You are a Senior Inventory Analyst for Hope for Haiti. 
    Provide a high-value, analytical summary of unfulfilled wishlists.
    - ACTIONABILITY: Use Markdown bolding (**text**) for high-priority items, large quantities (e.g., **500 units**), and key partner names.
    - STRUCTURE: Use exactly these three headers: **Top Critical Trends:**, **Partner Highlights:**, and **Aging Requests:**.
    - FORMATTING: Start each section header on a NEW LINE (\\n). Use sentence case for the descriptions.
    - CONSTRAINTS: Maximum 5 sentences. Be professional and concise.`;

    const userPrompt = `Here is the list of unfulfilled wishlists:\n${wishlists
      .map(
        (w) =>
          `- Partner: **${w.partner.name}** | Item: ${w.name} | Priority: **${w.priority.toLowerCase()}** | Quantity: ${w.quantity} | Last Updated: ${w.lastUpdated.toLocaleDateString()} | Comments: ${w.comments || "None"}`
      )
      .join("\n")}\n\nPlease identify trends and aging requests.`;

    const stream = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "omni-moderate",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        yield content;
      }
    }
  }
}

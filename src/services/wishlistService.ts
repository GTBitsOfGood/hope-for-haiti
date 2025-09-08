import { db } from "@/db";
import {
  CreateWishlistData,
  UpdateWishlistData,
  WishlistStats,
} from "@/types/api/wishlist.types";
import { NotFoundError } from "@/util/errors";
import { $Enums } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export class WishlistService {
  static async createWishlist(data: CreateWishlistData) {
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

  static async getWishlistItem(id: number) {
    return await db.wishlist.findUnique({
      where: {
        id,
      },
    });
  }

  static async getWishlistsByPartner(partnerId: number) {
    return await db.wishlist.findMany({
      where: {
        partnerId,
      },
    });
  }

  static async getWishlistsStatsByPartner() {
    const wishlistPromise = db.$queryRaw<
      {
        partnerId: number;
        priority: $Enums.RequestPriority;
        count: bigint;
      }[]
    >`
      SELECT "partnerId", "priority", COUNT("priority") as count
      FROM "Wishlist"
      GROUP BY "partnerId", "priority"
    `;

    const partnerPromise = db.user.findMany({
      where: {
        type: $Enums.UserType.PARTNER,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const [wishlists, partners] = await Promise.all([
      wishlistPromise,
      partnerPromise,
    ]);

    const statsByPartner: {
      [partnerId: number]: Omit<WishlistStats, "partnerId">;
    } = {};

    for (const partner of partners) {
      statsByPartner[partner.id] = {
        partnerName: partner.name,
        totalCount: 0,
        lowCount: 0,
        mediumCount: 0,
        highCount: 0,
      };
    }

    for (const wishlist of wishlists) {
      const count = Number(wishlist.count);
      statsByPartner[wishlist.partnerId].totalCount += count;
      switch (wishlist.priority) {
        case $Enums.RequestPriority.LOW:
          statsByPartner[wishlist.partnerId].lowCount += count;
          break;
        case $Enums.RequestPriority.MEDIUM:
          statsByPartner[wishlist.partnerId].mediumCount += count;
          break;
        case $Enums.RequestPriority.HIGH:
          statsByPartner[wishlist.partnerId].highCount += count;
          break;
      }
    }

    return Object.entries(statsByPartner).map(([partnerId, stats]) => ({
      partnerId: Number(partnerId),
      ...stats,
    })) as WishlistStats[];
  }
}

import { db } from "@/db";
import {
  CreateWishlistData,
  UpdateWishlistData,
} from "@/types/api/wishlist.types";
import { NotFoundError, ArgumentError } from "@/util/errors";
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

  static async getWishlistsStatsByPartner() {
    const stats = await db.$queryRaw<
      {
        partnerId: number;
        partnerName: string;
        totalCount: bigint;
        lowCount: bigint;
        mediumCount: bigint;
        highCount: bigint;
      }[]
    >`
        SELECT 
            u.id as "partnerId",
            u.name as "partnerName",
            COUNT(w.id) as "totalCount",
            SUM(CASE WHEN w.priority = 'LOW' THEN 1 ELSE 0 END) as "lowCount",
            SUM(CASE WHEN w.priority = 'MEDIUM' THEN 1 ELSE 0 END) as "mediumCount",
            SUM(CASE WHEN w.priority = 'HIGH' THEN 1 ELSE 0 END) as "highCount"
        FROM "User" u
        LEFT JOIN "Wishlist" w ON u.id = w."partnerId"
        WHERE u.type = 'PARTNER' AND u.enabled = true AND u.pending = false
        GROUP BY u.id, u.name
        ORDER BY u.id
    `;

    return stats.map((stat) => ({
      partnerId: stat.partnerId,
      partnerName: stat.partnerName,
      totalCount: Number(stat.totalCount),
      lowCount: Number(stat.lowCount),
      mediumCount: Number(stat.mediumCount),
      highCount: Number(stat.highCount),
    }));
  }
}

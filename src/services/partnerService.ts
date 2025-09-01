import { db } from "@/db";
import { UserType } from "@prisma/client";

import {
  PartnerSummary,
  PartnerSearchResult,
  PartnerDetails,
  UnallocatedItemRequestSummary,
  GetPartnersParams
} from "@/types/api/partner.types";

export class PartnerService {
  static canAccessPartnerDetails(userType: UserType, currentUserId: string, targetUserId: string): boolean {
    if (userType !== UserType.PARTNER) {
      return true;
    }
    
    return currentUserId === targetUserId;
  }

  static async getPartners(params: GetPartnersParams): Promise<PartnerSummary[] | PartnerSearchResult[]> {
    if (params.term) {
      const partners = await db.user.findMany({
        where: {
          type: UserType.PARTNER,
          name: {
            contains: params.term,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
        },
      });
      
      return partners.map((partner) => ({
        id: partner.id,
        name: partner.name,
      }));
    }

    const partners = await db.user.findMany({
      where: { type: UserType.PARTNER },
      select: {
        email: true,
        name: true,
        _count: {
          select: { unallocatedItemRequests: true },
        },
      },
    });

    return partners.map((partner) => ({
      name: partner.name,
      email: partner.email,
      unallocatedItemRequestCount: partner._count.unallocatedItemRequests,
    }));
  }

  static async getPartnerById(partnerId: number): Promise<PartnerDetails | null> {
    const partner = await db.user.findFirst({
      where: {
        id: partnerId,
        type: UserType.PARTNER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: { unallocatedItemRequests: true },
        },
      },
    });

    if (!partner) {
      return null;
    }

    return {
      id: partner.id,
      name: partner.name,
      email: partner.email,
      unallocatedItemRequestCount: partner._count.unallocatedItemRequests,
    };
  }

  static async getPartnerUnallocatedItemRequests(partnerId: number): Promise<UnallocatedItemRequestSummary[]> {
    const unallocatedItemRequests = await db.unallocatedItemRequest.findMany({
      where: { partnerId },
      select: {
        id: true,
        quantity: true,
        comments: true,
      },
    });

    return unallocatedItemRequests;
  }

  static async getPartnerEmails(): Promise<string[]> {
    const partners = await db.user.findMany({
      where: { type: UserType.PARTNER },
      select: {
        email: true,
      },
    });

    return partners.map((p) => p.email);
  }
}

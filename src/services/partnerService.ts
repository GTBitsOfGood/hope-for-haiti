import { db } from "@/db";
import { Prisma, UserType } from "@prisma/client";

import {
  PartnerSearchResult,
  PartnerDetails,
  GetPartnersParams,
} from "@/types/api/partner.types";

export class PartnerService {
  static canAccessPartnerDetails(
    userType: UserType,
    currentUserId: string,
    targetUserId: string
  ): boolean {
    if (userType !== UserType.PARTNER) {
      return true;
    }

    return currentUserId === targetUserId;
  }

  static async getPartners(
    params: GetPartnersParams
  ): Promise<PartnerSearchResult[]> {
    const where: Prisma.UserWhereInput = {
      type: UserType.PARTNER,
    };

    if (params.term && params.term.trim().length > 0) {
      where.name = {
        contains: params.term.trim(),
        mode: "insensitive",
      };
    }

    const partners = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return partners.map((partner) => ({
      id: partner.id,
      name: partner.name,
    }));
  }

  static async getPartnerById(
    partnerId: number
  ): Promise<PartnerDetails | null> {
    const partnerQuery = Prisma.validator<Prisma.UserFindFirstArgs>()({
      where: {
        id: partnerId,
        type: UserType.PARTNER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: { generalItemRequests: true },
        },
      },
    });

    const partner = await db.user.findFirst(partnerQuery);

    if (!partner) {
      return null;
    }

    type PartnerWithCount = Prisma.UserGetPayload<typeof partnerQuery>;

    const typedPartner = partner as PartnerWithCount;

    return {
      id: typedPartner.id,
      name: typedPartner.name,
      email: typedPartner.email,
      itemRequestCount: typedPartner._count.generalItemRequests,
    };
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

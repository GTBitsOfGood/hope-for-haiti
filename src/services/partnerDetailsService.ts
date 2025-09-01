import { db } from "@/db";
import { NotFoundError } from "@/util/errors";
import { PartnerDetails } from "@/schema/partnerDetails";
import {
  UpdatePartnerDetailsData
} from "@/types/api/partnerDetails.types";

export class PartnerDetailsService {
  static async getPartnerDetails(userId: number): Promise<PartnerDetails | null> {
    const userPartnerDetails = await db.user.findUnique({
      where: { id: userId },
      select: { partnerDetails: true },
    });

    if (!userPartnerDetails) {
      throw new NotFoundError("Partner details not found");
    }

    return userPartnerDetails.partnerDetails as PartnerDetails;
  }

  static async updatePartnerDetails(data: UpdatePartnerDetailsData): Promise<PartnerDetails> {
    const updatedUser = await db.user.update({
      where: { id: data.userId },
      data: {
        partnerDetails: data.partnerDetails,
      },
    });

    return updatedUser.partnerDetails as PartnerDetails;
  }
}

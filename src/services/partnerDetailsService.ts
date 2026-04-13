import { db } from "@/db";
import { NotFoundError } from "@/util/errors";
import { PartnerDetails } from "@/schema/partnerDetails";
import { UpdatePartnerDetailsData } from "@/types/api/partnerDetails.types";

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof result[key] === "object" &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        result[key] = deepMerge(
          result[key] as Record<string, unknown>,
          source[key] as Record<string, unknown>
        );
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

export class PartnerDetailsService {
  static async getPartnerDetails(
    userId: number
  ): Promise<PartnerDetails | null> {
    const userPartnerDetails = await db.user.findUnique({
      where: { id: userId },
      select: { partnerDetails: true },
    });

    if (!userPartnerDetails) {
      throw new NotFoundError("Partner details not found");
    }

    return userPartnerDetails.partnerDetails as PartnerDetails;
  }

  static async updatePartnerDetails(
    data: UpdatePartnerDetailsData
  ): Promise<PartnerDetails> {
    const existingDetails = await this.getPartnerDetails(data.userId);

    const mergedDetails = existingDetails
      ? deepMerge(
          existingDetails as Record<string, unknown>,
          data.partnerDetails as Record<string, unknown>
        )
      : data.partnerDetails;

    const updatedUser = await db.user.update({
      where: { id: data.userId },
      data: {
        partnerDetails: mergedDetails as unknown as PartnerDetails,
      },
    });

    return updatedUser.partnerDetails as PartnerDetails;
  }
}

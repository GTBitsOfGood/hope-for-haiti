import { PartnerDetails } from "@/schema/partnerDetails";

export interface GetPartnerDetailsParams {
  userId: number;
}

export interface UpdatePartnerDetailsData {
  userId: number;
  partnerDetails: PartnerDetails;
}

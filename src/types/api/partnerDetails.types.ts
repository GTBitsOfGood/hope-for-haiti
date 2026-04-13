import { PartnerDetailsUpdate } from "@/schema/partnerDetails";

export interface GetPartnerDetailsParams {
  userId: number;
}

export interface UpdatePartnerDetailsData {
  userId: number;
  partnerDetails: PartnerDetailsUpdate;
}

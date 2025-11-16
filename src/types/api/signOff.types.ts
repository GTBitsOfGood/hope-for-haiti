import { DistributionItem } from "@/types/api/distribution.types";

export interface CreateSignOffData {
  partnerId: number;
  staffName: string;
  partnerName: string;
  date: Date;
  signatureUrl: string;
  allocations: number[];
  staffUserId?: number;
}

export interface SignOffSummary {
  staffName: string;
  numberOfItems: number;
  dateCreated: Date;
  signOffDate: Date;
  status: string;
}

export interface SignOffSummaryResponse {
  signOffs: SignOffSummary[];
  total: number;
}

export interface SignOffDetails {
  id: number;
  date: Date;
  staffMemberName: string;
  partnerName: string;
  partnerId: number;
  distributions: DistributionItem[];
}

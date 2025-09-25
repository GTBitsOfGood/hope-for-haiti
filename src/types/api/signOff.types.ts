export interface SignedOffDistribution {
  allocationType: "unallocated" | "donorOffer";
  allocationId: number;
  actualQuantity: number;
}

export interface CreateSignOffData {
  partnerId: number;
  staffName: string;
  partnerName: string;
  date: Date;
  signatureBlob: string;
  distributions: SignedOffDistribution[];
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
  distributions: DistributionItem[];
}

export interface DistributionItem {
  id: number;
  title: string;
  type: string;
  expirationDate: Date | null;
  unitType: string;
  quantityPerUnit: number;
  quantityAllocated: number;
  actualQuantity: number;
}

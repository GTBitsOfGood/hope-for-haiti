import { LineItem, ShipmentStatus } from "@prisma/client";

export interface AllocatedItem {
  title: string;
  type: string;
  expirationDate: Date | null;
  unitType: string;
  quantityPerUnit: number;
  quantityAllocated: number;
  shipmentStatus: ShipmentStatus;
}

export interface DistributionItem extends LineItem {
  shipmentStatus: ShipmentStatus;
  quantityAllocated: number;
}

export interface SignedDistribution {
  signOffId: number;
  distributionDate: string;
  numberOfItems: number;
}

export interface SignOffDetailsResponse {
  itemDistributions: DistributionItem[];
  signOff: {
    date: string;
  };
}

export interface PartnerDistributionsResponse {
  items: AllocatedItem[];
  distributionItems: DistributionItem[];
  signedDistributions: SignedDistribution[];
}

export interface PartnerDistributionsResult {
  distributionItems: DistributionItem[];
  signedDistributions: SignedDistribution[];
}

export interface CompletedSignOff {
  partnerName: string;
  staffMemberName: string;
  date: Date;
  createdAt: Date;
  allocationCount: number;
}

export interface CompletedSignOffResponse {
  signoffs: CompletedSignOff[];
  total: number;
}

export interface PartnerAllocationSummary {
  partnerId: number;
  partnerName: string;
  allocationsCount: number;
  pendingSignOffCount: number;
}

export interface PartnerAllocationSummaryResponse {
  data: PartnerAllocationSummary[];
  total: number;
}

export interface SignOff {
  staffMemberName: string;
  partnerName: string;
  date: Date;
  signatureUrl: string;
  partnerId: number;
}

import { ShipmentStatus, Item } from "@prisma/client";

export interface AllocatedItem {
  title: string;
  type: string;
  expirationDate: Date | null;
  unitType: string;
  quantityPerUnit: number;
  quantityAllocated: number;
  shipmentStatus: ShipmentStatus;
}

export interface DistributionItem extends Item {
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
  items: AllocatedItem[];
  distributionItems: DistributionItem[];
  signedDistributions: SignedDistribution[];
}

export interface DistributionRecord {
  allocationType: string;
  allocationId: number;
  title: string;
  unitType: string;
  donorName: string;
  lotNumber: string;
  palletNumber: string;
  boxNumber: string;
  unitPrice: number;
  quantityAllocated: number;
  quantityAvailable: number;
  quantityTotal: number;
  donorShippingNumber: string | null;
  hfhShippingNumber: string | null;
}

export interface AdminDistributionsResult {
  records: DistributionRecord[];
}

export interface CompletedSignOff {
  partnerName: string;
  staffMemberName: string;
  date: Date;
  createdAt: Date;
  distributionCount: number;
}

export interface CompletedSignOffResponse {
  signoffs: CompletedSignOff[];
  total: number;
}

export interface PartnerAllocationSummary {
  partnerId: number;
  partnerName: string;
  visibleAllocationsCount: number;
  hiddenAllocationsCount: number;
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

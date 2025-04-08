import { Item, ShipmentStatus } from "@prisma/client";

export interface PartnerDistributionsResponse {
  items: AllocatedItem[];
  distributionItems: DistributionItem[];
  signedDistributions: SignedDistributions[];
}

export interface DistributionItem extends Item {
  shipmentStatus: ShipmentStatus;
  quantityAllocated: number;
}

export interface AllocatedItem {
  title: string;
  type: string;
  expirationDate: Date | null;
  unitType: string;
  quantityPerUnit: number;
  quantityAllocated: number;
  shipmentStatus: ShipmentStatus;
}

export interface SignedDistributions {
  signOffId: number;
  distributionDate: string;
  numberOfItems: number;
}

export interface SignOff {
  staffMemberName: string;
  partnerName: string;
  date: Date;
  signatureUrl: string;
  partnerId: number;
}

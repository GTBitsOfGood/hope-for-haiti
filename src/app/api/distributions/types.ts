import { Item, ShipmentStatus } from "@prisma/client";

export interface PartnerDistributionsResponse {
  distributionItems: DistributionItem[];
  signedDistributions: SignedDistributions[];
}

export interface DistributionItem extends Item {
  shipmentStatus: ShipmentStatus;
  quantityAllocated: number;
}

export interface SignedDistributions {
  signOffId: number;
  distributionDate: string;
  numberOfItems: number;
}

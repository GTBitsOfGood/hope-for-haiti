import { Item } from "@prisma/client";

export interface SignedDistributions {
  signOff: {
    date: string;
  };
  itemDistributions: DistributionItem[];
}

export interface DistributionItem extends Item {
  quantityAllocated: number;
}

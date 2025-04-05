import { Item } from "@prisma/client";

export interface DistributionItem {
  id: number;
  partnerId: number;
  signOffId: number | null;
  item: Item;
  quantityAllocated: number;
  quantityAvailable: number;
  total: number;
  visible: boolean;
}

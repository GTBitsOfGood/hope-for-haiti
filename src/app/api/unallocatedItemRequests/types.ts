import { Item } from "@prisma/client";

export interface UnallocatedItem extends Item {
  quantityLeft: number;
}

import { $Enums } from "@prisma/client";

export interface CreateWishlistData {
  partnerId: number;
  name: string;
  unitSize: string;
  quantity: number;
  priority: $Enums.RequestPriority;
  comments: string;
}

export interface UpdateWishlistData {
  id: number;
  name?: string;
  unitSize?: string;
  quantity?: number;
  priority?: $Enums.RequestPriority;
  comments?: string;
}

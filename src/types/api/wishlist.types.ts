import { $Enums, Wishlist } from "@prisma/client";

export interface CreateWishlistData {
  partnerId: number;
  name: string;
  unitSize: string;
  quantity: number;
  priority: $Enums.RequestPriority;
  comments: string;
}

export interface UpdateWishlistData
  extends Partial<Omit<CreateWishlistData, "partnerId">> {
  id: number;
}

// Aggregate record for the admin overview table
export interface WishlistAggregate {
  partnerId: number;
  partnerName: string;
  totalCount: number;
  lowCount: number;
  mediumCount: number;
  highCount: number;
}

// GET /api/wishlists can return either aggregates (staff) or items (partner)
export type GetWishlistsResponse = WishlistAggregate[] | Wishlist[];

// PATCH /api/wishlists/[partnerId] — request body (all optional)
export interface UpdateWishlistItemBody {
  name?: string;
  unitSize?: string;
  quantity?: number;
  priority?: $Enums.RequestPriority;
  comment?: string;
}

// Priority options for dropdowns
export const priorityOptions: { label: string; value: $Enums.RequestPriority }[] = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
];

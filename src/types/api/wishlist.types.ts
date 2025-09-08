
// Priority used for wishlist items
export type WishlistPriority = "LOW" | "MEDIUM" | "HIGH";

// Aggregate record for the admin overview table
export interface WishlistAggregate {
  partnerId: number;
  partnerName: string;
  totalCount: number;
  lowCount: number;
  medCount: number;
  highCount: number;
}

// Wishlist item shape for a single partner's wishlist
export interface WishlistItem {
  id: number;
  name: string;
  unitSize: string;
  quantity: number;
  priority: WishlistPriority;
  comment?: string;
  // Optional metadata
  createdAt?: string;
  updatedAt?: string;
}

// GET /api/wishlists can return either aggregates (staff) or items (partner)
export type GetWishlistsResponse = WishlistAggregate[] | WishlistItem[];

// PATCH /api/wishlists/[partnerId] — request body (all optional)
export interface UpdateWishlistItemBody {
  name?: string;
  unitSize?: string;
  quantity?: number;
  priority?: WishlistPriority;
  comment?: string;
}

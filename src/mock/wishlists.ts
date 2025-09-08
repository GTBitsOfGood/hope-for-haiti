import { WishlistAggregate, WishlistItem, WishlistPriority } from "@/types/api/wishlist.types";

export const mockWishlistAggregates: WishlistAggregate[] = [
  {
    partnerId: 101,
    partnerName: "Hope Clinic North",
    totalCount: 12,
    lowCount: 3,
    medCount: 6,
    highCount: 3,
  },
  {
    partnerId: 202,
    partnerName: "Sunrise Health Center",
    totalCount: 7,
    lowCount: 1,
    medCount: 3,
    highCount: 3,
  },
];

export const mockWishlistItems: WishlistItem[] = [
  {
    id: 1,
    name: "Acetaminophen 500mg",
    unitSize: "100 tablets",
    quantity: 10,
    priority: "HIGH",
    comment: "Urgent need for flu season",
  },
  {
    id: 2,
    name: "Surgical Gloves (M)",
    unitSize: "100 units",
    quantity: 20,
    priority: "MEDIUM",
  },
  {
    id: 3,
    name: "Bandages Assorted",
    unitSize: "50 units",
    quantity: 15,
    priority: "LOW",
    comment: "Restock next shipment",
  },
];

export const priorityOptions: { label: string; value: WishlistPriority }[] = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
];

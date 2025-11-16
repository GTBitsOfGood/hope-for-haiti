import { Prisma } from "@prisma/client";

export interface CreateGeneralItemParams {
  donorOfferId: number;
  title: string;
  expirationDate?: Date;
  unitType: string;
  initialQuantity: number;
  requestQuantity?: number;
  weight: number;
}

export type UpdateGeneralItemParams = Partial<
  Omit<CreateGeneralItemParams, "donorOfferId">
>;

export type GeneralItemWithRelations = Prisma.GeneralItemGetPayload<{
  include: {
    items: {
      where: {
        allocation: null;
      };
    };
    requests: {
      include: {
        partner: {
          select: { id: true; name: true };
        };
      };
    };
    donorOffer: true;
  };
}>;

// DTO for available items shown to partners
export interface AvailableItemDTO {
  id: number;
  title: string;
  expirationDate: Date | null;
  unitType: string;
  initialQuantity: number;
  availableQuantity: number;
  description: string | null;
  donorOffer: {
    id: number;
    offerName: string;
    donorName: string;
    state: string;
    archivedAt: Date | null;
    partnerResponseDeadline: string | null;
  };
  // Request fields (populated if partner has requested this item)
  requestId?: number | null;
  quantityRequested?: number | null;
  priority?: string | null;
  comments?: string | null;
  // Wishlist match information
  wishlistMatch: {
    wishlistId: number;
    wishlistTitle: string;
    strength: "hard" | "soft";
  } | null;
}

export interface AvailableItemsResponse {
  items: AvailableItemDTO[];
  total: number;
}

// DTO for partner requests
export interface PartnerRequestDTO {
  id: number;
  quantity: number;
  finalQuantity: number;
  comments: string | null;
  priority: string | null;
  createdAt: Date;
  generalItem: {
    id: number;
    title: string;
    description: string | null;
    expirationDate: Date | null;
    unitType: string;
    initialQuantity: number;
    donorOffer: {
      id: number;
      offerName: string;
      donorName: string;
      state: string;
      archivedAt: Date | null;
    };
  };
}

export interface PartnerRequestsResponse {
  requests: PartnerRequestDTO[];
  total: number;
}

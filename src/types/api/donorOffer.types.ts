import { DonorOfferState, DonorOfferItem, Item } from "@prisma/client";

export interface DonorOfferItemDTO {
  id: number;
  title: string;
  type: string;
  expiration?: string | null;
  quantity: number;
  unitSize: number;
}

export interface PartnerDonorOffer {
  donorOfferId: number;
  offerName: string;
  donorName: string;
  responseDeadline: Date;
  state: string;
}

export interface AdminDonorOffer {
  donorOfferId: number;
  offerName: string;
  donorName: string;
  responseDeadline: Date;
  state: DonorOfferState;
  invitedPartners: {
    name: string;
    responded: boolean;
  }[];
}

export interface PartnerDonorOffersResponse {
  donorOffers: PartnerDonorOffer[];
  total: number;
}

export interface AdminDonorOffersResponse {
  donorOffers: AdminDonorOffer[];
  total: number;
}

export interface ItemRequestWithAllocations {
  id: number;
  donorOfferItemId: number;
  partnerId: number;
  quantity: number;
  comments?: string | null;
  priority?: string | null;
  createdAt: Date;
  donorOfferItem: DonorOfferItem;
  partner: {
    name: string;
  };
  allocations: {
    id: number;
    donorOfferItemRequestId: number;
    itemId: number;
    quantity: number;
    item: Item;
  }[];
}

export interface ItemRequestsWithTotal {
  requests: ItemRequestWithAllocations[];
  total: number;
}

export interface DonorOfferItemLineItemsResponse {
  items: Item[];
  total: number;
}

export interface CreateDonorOfferResult {
  success: boolean;
  errors?: string[];
  donorOfferItems?: {
    title: string;
    type: string;
    quantity: number;
    unitType: string;
    quantityPerUnit: number;
    expirationDate?: Date | string;
  }[];
}

export interface DonorOfferItemsRequestsDTO {
  donorOfferItemId: number;
  title: string;
  type: string;
  expiration: string | null;
  quantity: number;
  unitSize: number;
  requestId: number | null;
  quantityRequested: number;
  comments: string | null;
  priority: string | null;
}

export interface DonorOfferItemsRequestsResponse {
  donorOfferName: string;
  donorOfferItemsRequests: DonorOfferItemsRequestsDTO[];
  total: number;
}

export interface UpdateRequestItem {
  title: string;
  type: string;
  expirationDate: string;
  unitType: string;
  quantity?: number;
}

export interface FinalizeDetailsResult {
  offerName: string;
  donorName: string;
  partnerRequestDeadline: string;
  donorRequestDeadline: string;
  partners: { id: number; name: string }[];
}

export interface FinalizeDonorOfferResult {
  success: boolean;
  errors?: string[];
  donorOfferId?: number;
  createdCount?: number;
}

export interface DonorOfferEditDetails {
  id: number;
  offerName: string;
  donorName: string;
  partnerResponseDeadline: Date;
  donorResponseDeadline: Date;
  items: DonorOfferItem[];
  partners: { id: number; name: string }[];
  total: number;
}

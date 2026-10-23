import {
  $Enums,
  DonorOfferState,
  GeneralItem,
  GeneralItemRequest,
  LineItem,
} from "@prisma/client";

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
  donorResponseDeadline: Date;
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

export type GeneralItemRequestWithDetails = GeneralItemRequest & {
  generalItem: Pick<
    GeneralItem,
    "id" | "title" | "expirationDate" | "unitType"
  >;
  partner: {
    name: string;
  };
};

export interface GeneralItemRequestsResponse {
  requests: GeneralItemRequestWithDetails[];
  total: number;
}

export interface GeneralItemLineItemsResponse {
  items: LineItem[];
  total: number;
}
export interface CreateDonorOfferResult {
  success: boolean;
  errors?: string[];
  donorOfferItems?: {
    title: string;
    initialQuantity: number;
    unitType: string;
    expirationDate?: Date | string;
  }[];
}

export interface DonorOfferItemsRequestsDTO {
  donorOfferItemId: number;
  title: string;
  expiration: string | null;
  initialQuantity: number;
  unitType: string;
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

// TEMP (#380): mirrors the shape the backend ticket (price-check preview)
// is adding to this same file. Delete this block and import the real
// types once that ticket merges — see the issue for the agreed shape.
export type PriceCheckStatus =
  | "no-code"
  | "unreadable"
  | "missing"
  | "expired"
  | "priced";

export interface PriceCheck {
  status: PriceCheckStatus;
  code: string | null;
  codeType: "NDC" | "UPC" | null;
  itemPriceId: number | null;
  price: string | null;
  priceSetOn: string | null;
  value: string | null;
}

export interface PriceCheckedItem {
  row: number;
  title: string;
  priceCheck: PriceCheck;
}

export interface FinalizeDonorOfferResult {
  success: boolean;
  errors?: string[];
  donorOfferId?: number;
  createdCount?: number;
  donorOfferItems?: Record<string, unknown>[];
  canFinalize?: boolean;
}

export interface DonorOfferUpdateParams {
  id: number;
  offerName: string;
  donorName: string;
  partnerResponseDeadline: Date;
  donorResponseDeadline: Date;
  partners: number[];
  state: $Enums.DonorOfferState;
}

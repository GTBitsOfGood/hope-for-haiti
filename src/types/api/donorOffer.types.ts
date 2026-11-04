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

export type PriceCheckStatus =
  | "no-code"
  | "unreadable"
  | "missing"
  | "expired"
  | "priced";

export interface PriceCheck {
  status: PriceCheckStatus;
  code: string | null; // cleaned-up code, or what the donor typed if unreadable
  codeType: "NDC" | "UPC" | null;
  itemPriceId: number | null; // pricebook entry id, needed to update an expired price
  price: string | null; // our price as text, like "12.00"
  priceSetOn: string | null; // date only, YYYY-MM-DD
  value: string | null; // # of containers × price, only for priced rows
}

export interface PriceCheckedItem {
  row: number; // same row number the upload errors use
  title: string;
  priceCheck: PriceCheck;
}

export interface FinalizeDonorOfferResult {
  success: boolean;
  errors?: string[];
  donorOfferId?: number;
  createdCount?: number;
  donorOfferItems?: Record<string, unknown>[];
  canFinalize?: boolean; // false while any row is expired or missing
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

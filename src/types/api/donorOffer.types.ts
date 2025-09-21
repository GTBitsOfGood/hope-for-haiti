import { DonorOfferState, GeneralItem } from "@prisma/client";

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

export interface CreateDonorOfferResult {
  success: boolean;
  errors?: string[];
  donorOfferItems?: {
    title: string;
    type: string;
    initialQuantity: number;
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
  initialQuantity: number;
  unitSize: number;
  requestId: number | null;
  quantityRequested: number;
  comments: string | null;
  priority: string | null;
}

export interface DonorOfferItemsRequestsResponse {
  donorOfferName: string;
  donorOfferItemsRequests: DonorOfferItemsRequestsDTO[];
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
  items: GeneralItem[];
  partners: { id: number; name: string }[];
}

import { RequestPriority } from "@prisma/client";

// DTO's are Data Transfer Objects. They are used to transfer data between the client and server.

export interface DonorOfferItemDTO {
  id: number;
  title: string;
  type: string;
  expiration?: string | null;
  quantity: number;
  unitSize: string;
}

export interface DonorOfferItemsRequestsDTO {
  requestId: number;
  title: string;
  type: string;
  expiration?: string | null;
  quantity: number;
  unitSize: string;
  quantityRequested: number;
  comments: string;
  priority: RequestPriority;
}

// Note, the name is sent back to help display the donor name in the UI.
export interface DonorOfferItemsRequestsResponse {
  donorOfferName: string;
  donorOfferItemsRequests: DonorOfferItemsRequestsDTO[];
}

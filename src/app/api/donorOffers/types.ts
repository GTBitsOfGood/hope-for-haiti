import { DonorOfferState } from "@prisma/client";

// DTOs are Data Transfer Objects. They are used to transfer data between the client and the server.

export interface DonorOfferDTO {
  donorOfferId: number;
  offerName: string;
  donorName: string;
  responseDeadline: string;
  state: DonorOfferState;
}

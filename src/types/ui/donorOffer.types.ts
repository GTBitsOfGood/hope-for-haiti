export interface DonorOfferDto {
  donorOfferId: number;
  offerName: string;
  donorName: string;
  responseDeadline: Date;
  state: "pending" | "submitted" | "closed" | null;
}

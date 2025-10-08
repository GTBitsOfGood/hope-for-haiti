export interface CreateSignOffData {
  partnerId: number;
  staffName: string;
  partnerName: string;
  date: Date;
  signatureUrl: string;
  allocations: number[];
}

export interface SignOffSummary {
  staffName: string;
  numberOfItems: number;
  dateCreated: Date;
  signOffDate: Date;
  status: string;
}

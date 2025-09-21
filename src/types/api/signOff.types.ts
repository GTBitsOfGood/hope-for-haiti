import { LineItem } from "@prisma/client";

export interface CreateSignOffData {
  partnerId: number;
  staffName: string;
  partnerName: string;
  date: Date;
  signatureBlob: string;
  allocations: number[];
}

export interface SignOffSummary {
  staffName: string;
  numberOfItems: number;
  dateCreated: Date;
  signOffDate: Date;
  status: string;
}

export interface SignOffDetails {
  id: number;
  date: Date;
  staffMemberName: string;
  partnerName: string;
  allocatedItems: LineItem[];
}

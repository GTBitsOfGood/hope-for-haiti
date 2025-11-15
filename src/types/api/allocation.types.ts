import { z } from "zod";

export interface CreateAllocationData extends Partial<ItemSearchParams> {
  partnerId?: number;
  distributionId: number;
  itemId: number;
  signOffId?: number;
}

export interface UpdateAllocationData {
  allocationId: number;
  title: string;
  expirationDate: Date;
  unitType: string;
  donorName: string;
  lotNumber: string;
  palletNumber: string;
  boxNumber: string;
}

export interface ItemSearchParams {
  title: string;
  expirationDate: Date;
  unitType: string;
  donorName?: string;
  lotNumber?: string;
  palletNumber?: string;
  boxNumber?: string;
}

export interface ItemSearchResult {
  donorNames: string[];
  lotNumbers: string[];
  palletNumbers: string[];
  boxNumbers: string[];
}

export const allocationSchema = z.object({
  partnerId: z.number().int().positive(),
  lineItemId: z.number().int().positive(),
  signOffId: z.number().int().positive().optional(),
});

export interface PartnerAllocation {
  id: number;
  generalItemTitle: string;
  lotNumber: string;
  palletNumber: string;
  boxNumber: string;
  quantity: number;
  donorName: string;
  shipmentStatus: string;
  signOffDate?: Date;
  signOffStaffMemberName?: string;
}

export interface PartnerAllocationsResponse {
  data: PartnerAllocation[];
  total: number;
}

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
  type: string;
  expirationDate: Date;
  unitType: string;
  quantityPerUnit: number;
  donorName: string;
  lotNumber: string;
  palletNumber: string;
  boxNumber: string;
}

export interface ItemSearchParams {
  title: string;
  type: string;
  expirationDate: Date;
  unitType: string;
  quantityPerUnit: number;
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

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
  quantity: number;
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

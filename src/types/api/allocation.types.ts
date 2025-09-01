export interface CreateAllocationData {
  unallocatedItemRequestId?: number;
  donorOfferItemRequestId?: number;
  partnerId?: number;
  quantity: number;
  itemId?: number;
  visible: boolean;
  // Item search fields
  title?: string;
  type?: string;
  expirationDate?: Date;
  unitType?: string;
  quantityPerUnit?: number;
  donorName?: string;
  lotNumber?: string;
  palletNumber?: string;
  boxNumber?: string;
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

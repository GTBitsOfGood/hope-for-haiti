export interface GeneralItem {
  title: string;
  type: string;
  expirationDate: Date | null;
  unitType: string;
  quantityPerUnit: number;
}

export interface QuantizedGeneralItem extends GeneralItem {
  quantity: number;
}

export interface QuantizedGeneralItemStringDate
  extends Omit<GeneralItem, "expirationDate"> {
  quantity: number;
  expirationDate: string | null;
}

export interface DistributionRecord {
  allocationType: "unallocated" | "donorOffer";
  allocationId: number;

  quantityAllocated: number;
  quantityAvailable: number;
  quantityTotal: number;

  title: string;
  unitType: string;
  donorName: string;
  lotNumber: string;
  palletNumber: string;
  boxNumber: string;
  unitPrice: number;

  donorShippingNumber: string | null;
  hfhShippingNumber: string | null;
}

export interface DistributionRecordWithActualQuantity
  extends DistributionRecord {
  actualQuantity?: number;
}

export interface SignedOffDistribution {
  allocationType: "unallocated" | "donorOffer";
  allocationId: number;
  actualQuantity: number;
}

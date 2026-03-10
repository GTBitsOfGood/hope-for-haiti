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

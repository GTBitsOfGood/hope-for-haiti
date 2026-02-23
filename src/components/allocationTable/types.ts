import { $Enums } from "@prisma/client";

export type AllocationTableRequest = {
  id: number;
  partnerId: number;
  partner: {
    id: number;
    name: string;
  };
  createdAt: string;
  quantity: number;
  finalQuantity?: number | null;
  priority: $Enums.RequestPriority | null;
  comments: string;
  itemsAllocated: number;
};

export type AllocationLineItem = {
  id: number;
  quantity: number;
  datePosted: string | null;
  donorName: string | null;
  lotNumber: string | null;
  palletNumber: string | null;
  boxNumber: string | null;
  allocation: {
    id: number;
    partner: {
      id: number;
      name: string;
    } | null;
  } | null;
};

export type AllocationTableItem = {
  id: number;
  title: string;
  type: string;
  quantity: number;
  expirationDate: string | null;
  unitType: string;
  quantityPerUnit: number;
  requests: AllocationTableRequest[];
  items: AllocationLineItem[];
};

export type OrphanedRequest = {
  requestId: number;
  generalItemId: number;
  generalItemTitle: string;
  partner: {
    id: number;
    name: string;
  };
  quantity: number;
  finalQuantity?: number | null;
};

export type PartnerAllocationInfo = {
  partnerId: number;
  partnerName: string;
  allocatedQuantity: number;
  requestedQuantity: number;
  finalRequestedQuantity: number | null;
};

export type GeneralItemOption = {
  id: number;
  title: string;
  unitType: string | null;
  expirationDate: string | null;
  partnerAllocations: PartnerAllocationInfo[];
};

export type AllocationTableMeta = {
  orphanedRequests: OrphanedRequest[];
  generalItemOptions: GeneralItemOption[];
};

export type AllocationSuggestion = {
  lineItemId: number;
  partnerId: number | null;
  partnerName: string | null;
};

export type AllocationChange = {
  lineItemId: number;
  previousPartner: { id: number; name: string } | null;
  nextPartner: { id: number; name: string } | null;
  previousAllocationId: number | null;
};

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

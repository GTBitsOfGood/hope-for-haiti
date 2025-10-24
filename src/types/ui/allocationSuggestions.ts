export type AllocationProgramLineItem = {
  lineItemId: number;
  quantity: number;
};

export type AllocationProgramPartner = {
  partnerId: number;
  target: number;
};

export type AllocationSuggestionProgram = {
  itemId: number;
  lp: string;
  lineItems: AllocationProgramLineItem[];
  partners: AllocationProgramPartner[];
};

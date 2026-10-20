export type ItemPriceResponse = {
  id: number;
  ndc: string;
  unitPrice: string;
  createdAt: string;
  updatedAt: string;
  enteredBy: { id: number; name: string };
  needsRecheck: boolean;
};

export type ItemPriceInput = { ndc: string; unitPrice: string };

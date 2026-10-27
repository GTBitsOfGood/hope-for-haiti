export type ItemPriceResponse = {
  id: number;
  ndc: string;
  name: string | null;
  unitPrice: string;
  createdAt: string;
  updatedAt: string;
  enteredBy: { id: number; name: string };
  needsRecheck: boolean;
};

export type ItemPriceInput = {
  ndc: string;
  name?: string | null;
  unitPrice: string;
};

export type ParsedPricebookRow = {
  lineNumber: number;
  code: unknown;
  name: unknown;
  price: unknown;
};

export type ItemPriceUploadStatus = "new" | "changed" | "same" | "problem";

export type ItemPriceUploadLine = {
  lineNumber: number;
  status: ItemPriceUploadStatus;
  code: string | null;
  rawCode: string;
  name: string | null;
  price: string | null;
  rawPrice: string;
  old: {
    id: number;
    name: string | null;
    unitPrice: string;
    updatedAt: string;
  } | null;
  reasons: string[];
};

export type ItemPriceUploadReview = {
  groups: {
    new: ItemPriceUploadLine[];
    changed: ItemPriceUploadLine[];
    same: ItemPriceUploadLine[];
    problems: ItemPriceUploadLine[];
  };
  counts: {
    new: number;
    changed: number;
    same: number;
    problems: number;
    skipped: number;
  };
  totalRows: number;
};

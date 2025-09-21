export interface PartnerSummary {
  name: string;
  email: string;
  itemRequestCount: number;
}

export interface PartnerSearchResult {
  id: number;
  name: string;
}

export interface PartnerDetails {
  id: number;
  name: string;
  email: string;
  itemRequestCount: number;
}

export interface UnallocatedItemRequestSummary {
  id: number;
  quantity: number;
  comments: string;
}

export interface GetPartnersParams {
  term?: string;
}

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

export interface GetPartnersParams {
  term?: string;
}

export interface CurrentRequestItem {
  requestId: number; 
  title: string; 
  quantityRequested: number; 
}

export interface CurrentRequestGroup {
  date: Date; 
  partner: {
    id: number; 
    name: string;
  };
  items: CurrentRequestItem[];
}

export interface CurrentRequestsResponse {
  data: CurrentRequestGroup[];
  total: number; 
}

export interface PastRequestItem {
  requestId: number; 
  title: string; 
  quantityRequested: number;
  quantityFulfilled: number; 
}

export interface PastRequestGroup {
  date: Date; 
  partner: {
    id: number; 
    name: string;
  };
  items: PastRequestItem[];
}

export interface PastRequestsResponse {
  data: PastRequestGroup[];
  total: number; 
}
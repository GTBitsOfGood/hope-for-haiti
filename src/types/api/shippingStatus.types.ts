import { LineItem, ShippingStatus, ShipmentStatus } from "@prisma/client";

export interface ShippingStatusWithItems {
  shippingStatuses: ShippingStatus[];
  items: LineItem[][];
  total: number;
}

export interface UpdateShippingStatusData {
  donorShippingNumber: string;
  hfhShippingNumber: string;
  value: ShipmentStatus;
}

export type Shipment = {
  id: number;
  donorShippingNumber: string;
  hfhShippingNumber: string;
  /**
   * Status
   */
  value: string;
  generalItems: {
    id: number;
    partner: {
      id: number;
      name: string;
    };
    lineItems: {
      quantity: number;
    }[];
  }[];
};

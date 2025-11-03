import {
  LineItem,
  ShippingStatus,
  ShipmentStatus,
  $Enums,
} from "@prisma/client";

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
  value: $Enums.ShipmentStatus;
  generalItems: {
    id: number;
    title: string;
    partner: {
      id: number;
      name: string;
    };
    lineItems: {
      quantity: number;
      palletNumber: string;
    }[];
  }[];
};

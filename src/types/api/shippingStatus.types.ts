import { LineItem, ShippingStatus, ShipmentStatus } from "@prisma/client";

export interface ShippingStatusWithItems {
  shippingStatuses: ShippingStatus[];
  items: LineItem[][];
}

export interface UpdateShippingStatusData {
  donorShippingNumber: string;
  hfhShippingNumber: string;
  value: ShipmentStatus;
}

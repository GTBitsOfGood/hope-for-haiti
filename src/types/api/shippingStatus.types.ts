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
  id: number;
  value: ShipmentStatus;
}

export type Shipment = {
  id: number;
  donorShippingNumber: string;
  hfhShippingNumber: string;
  value: $Enums.ShipmentStatus;
  signOffs: {
    id: number;
    staffMemberName: string;
    partnerName: string;
    date: Date;
    signatureUrl: string | null;
    lineItems: {
      id: number;
      quantity: number;
      palletNumber: string;
      boxNumber: string;
      lotNumber: string;
      generalItem: {
        id: number;
        title: string;
      };
      allocation: {
        partner: {
          id: number;
          name: string;
        };
      };
    }[];
  }[];
  lineItems: {
    id: number;
    quantity: number;
    palletNumber: string;
    boxNumber: string;
    lotNumber: string;
    generalItem: {
      id: number;
      title: string;
    };
    allocation: {
      id: number;
      partner: {
        id: number;
        name: string;
      };
      distribution: {
        id: number;
        pending: boolean;
      };
    };
  }[];
};

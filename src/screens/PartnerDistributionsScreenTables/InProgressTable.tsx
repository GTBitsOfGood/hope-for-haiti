"use client";

import React from "react";
import ShipmentStatusLabel from "./ShipmentStatusLabel";
import { format } from "date-fns";
import { AllocatedItem } from "@/types/api/distribution.types";
import BaseTable, { extendTableHeader } from "@/components/BaseTable";

interface InProgressTableProps {
  items: AllocatedItem[];
}

export default function InProgressTable({ items }: InProgressTableProps) {
  return (
    <BaseTable
      headers={[
        extendTableHeader("Title", "min-w-fit"),
        extendTableHeader("Type", "min-w-fit"),
        extendTableHeader("Expiration", "min-w-fit"),
        extendTableHeader("Unit type", "min-w-fit"),
        extendTableHeader("Qty/Unit", "min-w-fit"),
        extendTableHeader("Quantity allocated", "min-w-fit"),
        extendTableHeader("Shipment Status", "min-w-fit"),
      ]}
      rows={items.map((item) => ({
        cells: [
          item.title,
          item.type,
          item.expirationDate
            ? format(item.expirationDate, "MM/dd/yyyy")
            : "N/A",
          item.unitType,
          item.quantityPerUnit,
          item.quantityAllocated,
          <ShipmentStatusLabel
            shipmentStatus={item.shipmentStatus}
            key="shipmentStatus"
          ></ShipmentStatusLabel>,
        ],
      }))}
      pageSize={10}
      headerClassName="bg-blue-primary opacity-80 text-white"
    />
  );
}

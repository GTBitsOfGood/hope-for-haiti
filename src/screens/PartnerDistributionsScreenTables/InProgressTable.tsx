"use client";

import React from "react";
import ShipmentStatusLabel from "./ShipmentStatusLabel";
import { format } from "date-fns";
import { AllocatedItem } from "@/types/api/distribution.types";
import BaseTable from "@/components/BaseTable";

interface InProgressTableProps {
  items: AllocatedItem[];
}

export default function InProgressTable({ items }: InProgressTableProps) {
  return (
    <BaseTable
      headers={[
        "Title",
        "Type",
        "Expiration",
        "Unit type",
        "Qty/Unit",
        "Quantity allocated",
        "Shipment Status",
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
      headerCellStyles="min-w-fit"
      pageSize={10}
    />
  );
}

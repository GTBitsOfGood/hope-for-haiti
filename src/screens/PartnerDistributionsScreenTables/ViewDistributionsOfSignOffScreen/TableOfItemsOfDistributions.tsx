"use client";

import BaseTable, { extendTableHeader } from "@/components/BaseTable";
import { DistributionItem } from "@/types/api/distribution.types";
import { format } from "date-fns";
import React from "react";

interface Props {
  entries: DistributionItem[];
}

export default function TableOfItemsOfDistributions({ entries }: Props) {
  return (
    <BaseTable
      headers={[
        extendTableHeader("Title", "min-w-fit"),
        extendTableHeader("Type", "min-w-fit"),
        extendTableHeader("Expiration", "min-w-fit"),
        extendTableHeader("Unit type", "min-w-fit"),
        extendTableHeader("Qty/Unit", "min-w-fit"),
        extendTableHeader("Quantity allotted", "min-w-fit"),
      ]}
      rows={entries.map((entry) => ({
        cells: [
          entry.title,
          entry.type,
          entry.expirationDate
            ? format(entry.expirationDate, "MM/dd/yyyy")
            : "N/A",
          entry.unitType,
          entry.quantityPerUnit,
          entry.quantityAllocated,
        ],
      }))}
      pageSize={10}
      headerClassName="bg-blue-primary opacity-80 text-white"
    />
  );
}

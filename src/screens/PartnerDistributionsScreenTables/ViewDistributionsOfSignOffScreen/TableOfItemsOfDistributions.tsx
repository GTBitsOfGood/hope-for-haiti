"use client";

import BaseTable from "@/components/BaseTable";
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
        "Title",
        "Type",
        "Expiration",
        "Unit type",
        "Qty/Unit",
        "Quantity allotted",
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
      headerCellStyles="min-w-fit"
      pageSize={10}
    />
  );
}

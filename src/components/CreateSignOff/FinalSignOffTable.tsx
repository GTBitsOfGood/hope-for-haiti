import { DistributionRecordWithActualQuantity } from "@/types";
import React from "react";
import BaseTable from "../BaseTable";

export default function FinalSignOffTable({
  distributions,
}: {
  distributions: DistributionRecordWithActualQuantity[];
}) {
  return (
    <BaseTable
      headers={[
        { label: "Name" },
        { label: "Quantity Allocated" },
        { label: "Qty Avail/Total" },
        { label: "Donor Name" },
        { label: "Lot Number" },
        { label: "Actual Quantity" },
      ]}
      rows={distributions.map((distribution) => ({
        cells: [
          distribution.title,
          distribution.quantityAllocated,
          `${distribution.quantityAvailable}/${distribution.quantityTotal}`,
          distribution.donorName,
          distribution.lotNumber,
          distribution.actualQuantity || distribution.quantityAllocated,
        ],
      }))}
      pageSize={5}
      headerClassName="bg-blue-primary opacity-80 text-white"
    />
  );
}

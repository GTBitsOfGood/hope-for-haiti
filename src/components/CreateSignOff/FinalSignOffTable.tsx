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
        "Name",
        "Quantity Allocated",
        "Qty Avail/Total",
        "Donor Name",
        "Lot Number",
        "Actual Quantity",
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
    />
  );
}

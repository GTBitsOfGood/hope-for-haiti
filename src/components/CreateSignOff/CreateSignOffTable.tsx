import { DistributionRecord } from "@/types";
import React from "react";
import BaseTable from "../BaseTable";

export default function CreateSignOffTable({
  // refetch,
  distributions,
  selectedDistributions,
  addToSelectedDistributions,
  removeFromSelectedDistributions,
}: {
  refetch: () => void;
  distributions: DistributionRecord[];
  selectedDistributions: DistributionRecord[];
  addToSelectedDistributions: (dist: DistributionRecord) => void;
  removeFromSelectedDistributions: (dist: DistributionRecord) => void;
}) {
  return (
    <BaseTable
      headers={[
        "",
        "Name",
        "Quantity Allocated",
        "Qty Avail/Total",
        "Donor Name",
        "Pallet",
        "Box number",
        "Lot number",
        "Unit price",
        "Donor Shipping #",
        "HfH Shipping #",
      ]}
      rows={distributions.map((distribution) => ({
        cells: [
          <input
            type="checkbox"
            checked={selectedDistributions.some(
              (otherDistribution) =>
                JSON.stringify(otherDistribution) ===
                JSON.stringify(distribution)
            )}
            onChange={(e) => {
              if (e.target.checked) {
                addToSelectedDistributions(distribution);
              } else {
                removeFromSelectedDistributions(distribution);
              }
            }}
            className="bg-zinc-50 border-gray-200 rounded focus:ring-0"
            key={1}
          />,
          distribution.title,
          distribution.quantityAllocated,
          `${distribution.quantityAvailable}/${distribution.quantityTotal}`,
          distribution.donorName,
          distribution.palletNumber,
          distribution.boxNumber,
          distribution.lotNumber,
          distribution.unitPrice.toString(),
          distribution.donorShippingNumber,
          distribution.hfhShippingNumber,
        ],
      }))}
      pageSize={10}
      headerClassName="bg-blue-primary opacity-80 text-white"
    />
  );
}

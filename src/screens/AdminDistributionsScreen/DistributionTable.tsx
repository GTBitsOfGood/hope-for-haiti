import { ChatTeardropText } from "@phosphor-icons/react";
import React from "react";
import { Tooltip } from "react-tooltip";
import DistributionActions from "./DistributionActions";
import { DistributionRecord } from "@/types";
import BaseTable from "@/components/BaseTable";

export default function DistributionTable({
  refetch,
  visible,
  distributions,
}: {
  refetch: () => void;
  visible: boolean;
  distributions: DistributionRecord[];
}) {
  return (
    <BaseTable
      headers={[
        { label: "Name" },
        { label: "Quantity Allocated" },
        { label: "Qty Avail/Total" },
        { label: "Donor Name" },
        { label: "Pallet" },
        { label: "Box number" },
        { label: "Lot number" },
        { label: "Unit price" },
        { label: "Donor Shipping #" },
        { label: "HfH Shipping #" },
        { label: "Comment" },
        { label: "Manage" },
      ]}
      rows={distributions.map((distribution) => ({
        cells: [
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
          <div key={1}>
            <ChatTeardropText
              data-tooltip-id={`comment-tooltip-${NaN}`}
              data-tooltip-content={"TODO NOTES"}
              size={30}
              color={distribution.donorName ? "black" : "lightgray"}
            />
            {distribution.donorName && (
              <Tooltip id={`comment-tooltip-${NaN}`} className="max-w-40">
                {"TODO NOTES"}
              </Tooltip>
            )}
          </div>,
          <DistributionActions
            refetch={refetch}
            visible={visible}
            distribution={distribution}
            key={2}
          />,
        ],
      }))}
      pageSize={10}
      headerClassName="bg-blue-primary opacity-80 text-white"
    />
  );
}

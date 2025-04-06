import { DistributionItem } from "@/app/api/distributions/types";
import { ChatTeardropText } from "@phosphor-icons/react";
import React, { Dispatch, SetStateAction } from "react";
import { Tooltip } from "react-tooltip";
import DistributionActions from "./DistributionActions";

export default function DistributionTable({
  distributions,
  setDistributions,
}: {
  distributions: DistributionItem[];
  setDistributions: Dispatch<SetStateAction<DistributionItem[]>>;
}) {
  return (
    <div className="overflow-x-scroll pb-32">
      <table className="mt-4 rounded-t-lg min-w-full">
        <thead>
          <tr className="bg-blue-primary opacity-80 text-white border-b-2">
            <th className="px-4 py-2 text-left font-bold">Name</th>
            <th className="px-4 py-2 text-left font-bold">
              Quantity Allocated
            </th>
            <th className="px-4 py-2 text-left font-bold">Qty Avail/Total</th>
            <th className="px-4 py-2 text-left font-bold">Donor Name</th>
            <th className="px-4 py-2 text-left font-bold">Pallet number</th>
            <th className="px-4 py-2 text-left font-bold">Box number</th>
            <th className="px-4 py-2 text-left font-bold">Lot number</th>
            <th className="px-4 py-2 text-left font-bold">Unit price</th>
            <th className="px-4 py-2 text-left font-bold">Donor Shipping #</th>
            <th className="px-4 py-2 text-left font-bold">HfH Shipping #</th>
            <th className="px-4 py-2 text-left font-bold">Comment</th>
            <th className="px-4 py-2 text-left font-bold">Manage</th>
          </tr>
        </thead>
        <tbody>
          {distributions.map((distribution, index) => (
            <React.Fragment key={index}>
              <tr
                data-odd={index % 2 !== 0}
                className={`bg-white data-[odd=true]:bg-gray-50 border-b transition-colors`}
              >
                <td className="px-4 py-2">{distribution.title}</td>
                <td className="px-4 py-2">{distribution.quantityAllocated}</td>
                <td className="px-4 py-2">
                  {/* {distribution.quantityAvailable}/{distribution.total} */}
                  TODO
                </td>
                <td className="px-4 py-2">{distribution.donorName}</td>
                <td className="px-4 py-2">{distribution.palletNumber}</td>
                <td className="px-4 py-2">{distribution.boxNumber}</td>
                <td className="px-4 py-2">{distribution.lotNumber}</td>
                <td className="px-4 py-2">
                  {distribution.unitPrice.toString()}
                </td>
                <td className="px-4 py-2">
                  {distribution.donorShippingNumber}
                </td>
                <td className="px-4 py-2">{distribution.hfhShippingNumber}</td>
                <td className="px-4 py-2">
                  <ChatTeardropText
                    data-tooltip-id={`comment-tooltip-${distribution.id}`}
                    data-tooltip-content={distribution.notes}
                    size={30}
                    color={distribution.notes ? "black" : "lightgray"}
                  />
                  {distribution.notes && (
                    <Tooltip
                      id={`comment-tooltip-${distribution.id}`}
                      className="max-w-40"
                    >
                      {distribution.notes}
                    </Tooltip>
                  )}
                </td>
                <td className="px-4 py-2">
                  <DistributionActions
                    distribution={distribution}
                    setDistributions={setDistributions}
                  />
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

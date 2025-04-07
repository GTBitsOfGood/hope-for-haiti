import { DistributionRecord } from "@/types";
import React from "react";

export default function CreateSignOffTable({
  // refetch,
  distributions,
}: {
  refetch: () => void;
  distributions: DistributionRecord[];
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
            <th className="px-4 py-2 text-left font-bold">Pallet</th>
            <th className="px-4 py-2 text-left font-bold">Box number</th>
            <th className="px-4 py-2 text-left font-bold">Lot number</th>
            <th className="px-4 py-2 text-left font-bold">Unit price</th>
            <th className="px-4 py-2 text-left font-bold">Donor Shipping #</th>
            <th className="px-4 py-2 text-left font-bold">HfH Shipping #</th>
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
                  {distribution.quantityAvailable}/{distribution.quantityTotal}
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
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

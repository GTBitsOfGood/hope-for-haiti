"use client";

import { DistributionItem } from "@/app/api/distributions/types";
import React from "react";
import ShipmentStatusLabel from "./ShipmentStatusLabel";
import { format } from "date-fns";

interface InProgressTableProps {
  items: DistributionItem[];
}

export default function InProgressTable({ items }: InProgressTableProps) {
  return (
    <div className="overflow-x-scroll overflow-y-auto">
      <table className="mt-4 rounded-t-lg overflow-hidden table-auto w-full">
        <thead>
          <tr className="bg-blue-primary opacity-80 text-white border-b-2">
            <th className="px-4 py-2 text-left font-bold min-w-fit">Title</th>
            <th className="px-4 py-2 text-left font-bold min-w-fit">Type</th>
            <th className="px-4 py-2 text-left font-bold min-w-fit">
              Expiration
            </th>
            <th className="px-4 py-2 text-left font-bold min-w-fit">
              Unit type
            </th>
            <th className="px-4 py-2 text-left font-bold min-w-fit">
              Qty/Unit
            </th>
            <th className="px-4 py-2 text-left font-bold min-w-fit">
              Quantity allocated
            </th>
            <th className="pl-4 py-2 text-left font-bold min-w-fit">
              Shipment Status
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <tr
                data-odd={index % 2 !== 1}
                className={`bg-white data-[odd=true]:bg-gray-50 break-words`}
              >
                <td className="px-4 py-2">{item.title}</td>
                <td className="px-4 py-2">{item.type}</td>
                <td className="px-4 py-2">
                  {item.expirationDate
                    ? format(item.expirationDate, "MM/dd/yyyy")
                    : "N/A"}
                </td>
                <td className="px-4 py-2">{item.unitType}</td>
                <td className="px-4 py-2">{item.quantityPerUnit}</td>
                <td className="px-4 py-2">{item.quantityAllocated}</td>
                <td className="px-4 py-2">
                  <ShipmentStatusLabel
                    shipmentStatus={item.shipmentStatus}
                  ></ShipmentStatusLabel>
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

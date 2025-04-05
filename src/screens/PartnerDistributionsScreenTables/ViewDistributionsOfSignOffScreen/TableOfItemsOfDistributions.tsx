"use client";

import { DistributionItem } from "@/app/api/distributions/[signOffId]/types";
import { format } from "date-fns";
import React from "react";

interface Props {
  entries: DistributionItem[];
}

export default function TableOfItemsOfDistributions({ entries }: Props) {
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
              Quantity alloted
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <React.Fragment key={index}>
              <tr
                data-odd={index % 2 !== 1}
                className={`bg-white data-[odd=true]:bg-gray-50 break-words`}
              >
                <td className="px-4 py-2">{entry.title}</td>
                <td className="px-4 py-2">{entry.type}</td>
                <td className="px-4 py-2">
                  {entry.expirationDate
                    ? format(entry.expirationDate, "MM/dd/yyyy")
                    : "N/A"}
                </td>
                <td className="px-4 py-2">{entry.unitType}</td>
                <td className="px-4 py-2">{entry.quantityPerUnit}</td>
                <td className="px-4 py-2">{entry.quantityAllocated}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

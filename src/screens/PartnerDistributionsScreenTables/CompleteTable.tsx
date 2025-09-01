"use client";

import { SignedDistribution } from "@/types/api/distribution.types";
import { useRouter } from "next/navigation";
import React from "react";

interface InProgressTableProps {
  entries: SignedDistribution[];
}

export default function CompleteTable({ entries }: InProgressTableProps) {
  const router = useRouter();
  return (
    <div className="overflow-x-scroll overflow-y-auto">
      <table className="mt-4 rounded-t-lg overflow-hidden table-auto w-full">
        <thead>
          <tr className="bg-blue-primary opacity-80 text-white border-b-2">
            <th className="px-4 py-2 text-left font-bold min-w-fit w-1/2">
              Distribution date
            </th>
            <th className="px-4 py-2 text-left font-bold min-w-fit w-1/2">
              Number of items in distribution
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <React.Fragment key={index}>
              <tr
                data-odd={index % 2 !== 1}
                className={`bg-white data-[odd=true]:bg-gray-50 break-words hover:bg-gray-200 cursor-pointer`}
                onClick={() => {
                  router.push(`/distributions/view/${entry.signOffId}`);
                }}
              >
                <td className="px-4 py-2">{entry.distributionDate}</td>
                <td className="px-4 py-2">{entry.numberOfItems}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

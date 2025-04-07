import PriorityTag from "@/components/PriorityTag";
import { formatTableValue } from "@/utils/format";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { RequestPriority } from "@prisma/client";
import React from "react";
import { useEffect, useState } from "react";

// const tabs = [
//   { value: "all", label: "All" },
//   { value: "pending", label: "Pending" },
//   { value: "completed", label: "Completed" },
//   { value: "denied", label: "Denied" },
// ];

interface ItemRequest {
  id: number;
  title: string;
  type: string;
  expirationDate: string;
  unitType: string;
  quantityPerUnit: string;
  priority: RequestPriority;
  quantity: string;
  comments: string;
  createdAt: string;
}

export default function MyRequests() {
  // const [activeTab, setActiveTab] = useState<string>("all");

  const [data, setData] = useState<ItemRequest[] | null | undefined>(undefined);
  useEffect(() => {
    (async () => {
      const resp = await fetch("/api/unallocatedItemRequest", {
        cache: "no-store",
      });
      setData(await resp.json());
    })();
  }, []);

  return (
    <>
      <div className="mt-7 relative w-1/3">
        <MagnifyingGlass
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          size={18}
        />
        <input
          type="text"
          placeholder="Search"
          className="pl-10 pr-4 py-2 w-full border border-gray-primary border-opacity-10 rounded-lg bg-gray-100 text-gray-primary focus:outline-none focus:border-gray-400"
        />
      </div>

      {/* <div className="flex space-x-4 mt-4 border-b-2 border-gray-primary border-opacity-10">
        {tabs.map(({ value, label }) => {
          return (
            <button
              key={value}
              data-active={activeTab === value}
              className="px-2 py-1 text-md font-medium text-gray-primary text-opacity-70 relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-gray-primary data-[active=true]:bottom-[-1px] data-[active=true]:text-opacity-100"
              onClick={() => setActiveTab(value)}
            >
              <div className="hover:bg-gray-100 px-2 py-1 rounded">{label}</div>
            </button>
          );
        })}
      </div> */}

      <table className="mt-4 rounded-t-lg overflow-hidden table-fixed w-full">
        <thead>
          <tr className="bg-blue-primary opacity-80 text-white font-bold border-b-2">
            <th className="px-4 py-2 text-left font-bold">Title</th>
            <th className="px-4 py-2 text-left font-bold">Type</th>
            <th className="px-4 py-2 text-left font-bold">Priority</th>
            <th className="px-4 py-2 text-left font-bold">
              Quantity Requested
            </th>
            <th className="px-4 py-2 text-left font-bold">Expiration</th>
            <th className="px-4 py-2 text-left font-bold">Unit Type</th>
            <th className="px-4 py-2 text-left font-bold">Qty/Unit</th>
            <th className="pl-4 py-2 text-left font-bold">Date Requested</th>
            <th className="pl-4 py-2 text-left font-bold">Comments</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((item, index) => (
            <React.Fragment key={item.id}>
              <tr
                data-odd={index % 2 !== 0}
                className={`bg-white data-[odd=true]:bg-gray-50 break-words`}
              >
                <td className="px-4 py-2">{formatTableValue(item.title)}</td>
                <td className="px-4 py-2">{formatTableValue(item.type)}</td>
                <td className="px-4 py-2">
                  <PriorityTag priority={item.priority} />
                </td>
                <td className="px-4 py-2">{formatTableValue(item.quantity)}</td>
                <td className="px-4 py-2">
                  {formatTableValue(item.expirationDate)}
                </td>
                <td className="px-4 py-2">{formatTableValue(item.unitType)}</td>
                <td className="px-4 py-2">
                  {formatTableValue(item.quantityPerUnit)}
                </td>
                <td className="px-4 py-2">
                  {formatTableValue(item.createdAt)}
                </td>
                <td className="px-4 py-2">{formatTableValue(item.comments)}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </>
  );
}

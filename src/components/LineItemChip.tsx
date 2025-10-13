import useOnClickOutside from "@/hooks/useOnClickOutside";
import { UnallocatedItemData } from "@/screens/AdminUnallocatedItemsScreen";
import { useState } from "react";

export default function LineItemChip({
  item,
  requests,
}: {
  item: UnallocatedItemData["items"][number];
  requests: UnallocatedItemData["requests"];
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useOnClickOutside<HTMLDivElement>(() =>
    setIsDropdownOpen(false)
  );

  async function allocateItem(
    request: UnallocatedItemData["requests"][number]
  ) {
    // Handle allocation logic here
    console.log(`Allocating item ${item.id} to request ${request.id}`);
    setIsDropdownOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="rounded-lg border border-blue-300 bg-white m-2 px-2 py-1 text-sm font-bold flex items-center gap-1 hover:shadow"
      >
        <span>{item.palletNumber}</span>
        <span className="rounded-lg bg-blue-200 text-blue-500 px-1">
          {item.quantity}
        </span>
      </button>
      <span
        className={`absolute left-0 top-0 rounded text-xs px-1 shadow-sm ${item.allocation ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"}`}
      >
        {item.allocation?.partner ? item.allocation.partner.name : "None"}
      </span>

      {/* Allocation Dropdown */}
      <div
        ref={dropdownRef}
        className={`absolute z-10 w-48 bg-white border border-gray-300 rounded shadow-lg p-2 text-sm font-bold ${
          isDropdownOpen ? "block" : "hidden"
        }`}
      >
        <p className="text-gray-500 mb-1">Assign to Organization</p>
        <div className="flex flex-col">
          {requests.map((request) => (
            <button
              key={request.id}
              onClick={() => allocateItem(request)}
              className="flex justify-between text-left px-2 py-1 hover:bg-blue-100 rounded"
            >
              <p>{request.partner.name}</p>
              {/* TODO: Replace with "allocated / requested" */}
              <p className="text-blue-500">{request.quantity}</p>
            </button>
          ))}
          <button className="text-left px-2 py-1 hover:bg-red-100 rounded">
            {
              item.allocation ? "Unallocate" : "None"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

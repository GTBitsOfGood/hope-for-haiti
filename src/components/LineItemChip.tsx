import { UnallocatedItemData } from "@/screens/AdminUnallocatedItemsScreen";
import { useState } from "react";

export default function LineItemChip({
  item,
}: {
  item: UnallocatedItemData["items"][number];
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
        {item.allocation ? item.allocation.id : "None"}
      </span>
    </div>
  );
}

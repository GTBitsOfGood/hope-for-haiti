import { useApiClient } from "@/hooks/useApiClient";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import { UnallocatedItemData } from "@/screens/AdminUnallocatedItemsScreen";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { AdvancedBaseTableHandle } from "./baseTable/AdvancedBaseTable";

export default function LineItemChip({
  item,
  requests,
  generalItemId,
  updateItem,
  updateItemsAllocated,
}: {
  item: UnallocatedItemData["items"][number];
  requests: UnallocatedItemData["requests"];
  generalItemId: number;
  updateItem: AdvancedBaseTableHandle<UnallocatedItemData>["updateItemById"];
  updateItemsAllocated: (partnerId: number) => void;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useOnClickOutside<HTMLDivElement>(() =>
    setIsDropdownOpen(false)
  );

  const { apiClient } = useApiClient();

  function updateLineItemInTable(updatedItem: Partial<typeof item>) {
    updateItem(generalItemId, (prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === item.id ? { ...it, ...updatedItem } : it
      ),
    }));
  }

  async function unallocateItem() {
    if (!item.allocation?.id) {
      toast("Item is not allocated to any organization.");
      setIsDropdownOpen(false);
      return;
    }

    // Handle unallocation logic here
    setIsDropdownOpen(false);

    const response = await apiClient.delete<{
      deletedDistribution: boolean;
    }>(`/api/allocations/${item.allocation?.id}`);

    toast.success(
      response.deletedDistribution
        ? `Item unallocated from ${item.allocation?.partner?.name} and distribution deleted successfully.`
        : `Item unallocated from ${item.allocation?.partner?.name} successfully.`
    );

    updateLineItemInTable({ allocation: null });
    updateItemsAllocated(item.allocation.partner!.id);
  }

  async function allocateItem(
    request: UnallocatedItemData["requests"][number]
  ) {
    if (item.allocation?.partner?.id === request.partnerId) {
      unallocateItem();
      return;
    }

    if (item.allocation?.id) {
      await unallocateItem();
    }

    // Handle allocation logic here
    setIsDropdownOpen(false);

    const response = await apiClient.post<{
      allocation: {
        id: number;
        itemId: number;
        distributionId: number;
        partner: {
          id: number;
          name: string;
        } | null;
      };
    }>("/api/allocations", {
      body: JSON.stringify({
        partnerId: request.partnerId,
        lineItem: item.id,
      }),
    });

    toast.success(`Item allocated to ${request.partner.name} successfully!`);

    updateLineItemInTable({ allocation: response.allocation });
    updateItemsAllocated(request.partnerId);
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
        <p className="text-gray-500 mb-1">Allocate to Organization</p>
        <div className="flex flex-col overflow-y-scroll max-h-60">
          {requests.map((request) => (
            <button
              key={request.id}
              onClick={() => allocateItem(request)}
              className={`flex justify-between text-left px-2 py-1 rounded transition-all duration-200 ${item.allocation?.partner?.id === request.partner?.id ? "bg-blue-200 hover:bg-red-100" : "hover:bg-blue-100"}`}
            >
              <p>{request.partner.name}</p>
              <p className="text-blue-500">
                {request.itemsAllocated}/{request.quantity}
              </p>
            </button>
          ))}
          <button
            onClick={unallocateItem}
            className="text-left px-2 py-1 hover:bg-red-100 rounded transition-all duration-200"
          >
            {item.allocation ? "Unallocate" : "None"}
          </button>
        </div>
      </div>
    </div>
  );
}

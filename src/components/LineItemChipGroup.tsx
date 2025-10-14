import { useApiClient } from "@/hooks/useApiClient";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import { UnallocatedItemData } from "@/screens/AdminUnallocatedItemsScreen";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { AdvancedBaseTableHandle } from "./baseTable/AdvancedBaseTable";

export default function LineItemChipGroup({
  items,
  requests,
  generalItemId,
  updateItem,
  updateItemsAllocated,
}: {
  items: UnallocatedItemData["items"];
  requests: UnallocatedItemData["requests"];
  generalItemId: number;
  updateItem: AdvancedBaseTableHandle<UnallocatedItemData>["updateItemById"];
  updateItemsAllocated: (itemId: number, partnerId: number) => void;
}) {
  const sortedItems = [...items].sort((a, b) =>
    (a.allocation === null) === (b.allocation === null)
      ? a.palletNumber?.localeCompare(b.palletNumber || "") || 0
      : (a.allocation === null ? 1 : -1) - (b.allocation === null ? 1 : -1)
  );

  return (
    <div className="w-full bg-sunken flex flex-wrap p-2">
      {items.length === 0 && (
        <p className="w-full text-center text-gray-primary">
          No line items available.
        </p>
      )}
      {sortedItems.map((item) => (
        <LineItemChip
          key={item.id}
          item={item}
          requests={requests}
          generalItemId={generalItemId}
          updateItem={updateItem}
          updateItemsAllocated={(partnerId) =>
            updateItemsAllocated(generalItemId, partnerId)
          }
        />
      ))}
    </div>
  );
}

function LineItemChip({
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

  const [distToNavbar, setDistToNavbar] = useState(0);

  useEffect(() => {
    const navbar = document.getElementById("navbar");
    if (!navbar || !dropdownRef.current || !isDropdownOpen) return;

    const navbarRect = navbar.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();

    console.log(dropdownRect.left - navbarRect.right);
    setDistToNavbar(dropdownRect.left - navbarRect.right);
  }, [dropdownRef, isDropdownOpen]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative rounded-lg border border-blue-primary m-2 px-2 py-1 text-sm flex items-center gap-1 hover:shadow"
      >
        <span className="text-blue-primary">{item.palletNumber}</span>
        <span className="rounded bg-blue-primary/20 text-blue-primary font-bold px-[2px]">
          {item.quantity}
        </span>
        <span className="absolute -left-2 -top-2 rounded overflow-clip text-xs shadow-sm bg-white">
          {/* Double span is because the background color is based off opacity, but should still be opaque */}
          <span
            className={`w-full h-full px-1 py-[1px] ${item.allocation ? "bg-red-primary/20 text-red-primary" : "bg-gray-primary/10 text-gray-primary/30"}`}
          >
            {item.allocation?.partner ? item.allocation.partner.name : "None"}
          </span>
        </span>
      </button>

      {/* Allocation Dropdown */}
      <div
        ref={dropdownRef}
        className={`absolute ${distToNavbar < 50 ? "left-0" : "right-0"} z-50 w-48 bg-white border border-gray-primary/20 rounded shadow-lg p-2 text-sm font-bold ${
          isDropdownOpen ? "block" : "hidden"
        }`}
      >
        <p className="text-gray-500 mb-1">Allocate to Partner</p>
        <div className="flex flex-col overflow-y-scroll max-h-60 space-y-1">
          {item.allocation && (
            <button
              onClick={unallocateItem}
              className="text-left px-2 py-1 hover:bg-red-primary/20 rounded transition-all duration-200"
            >
              Unallocate
            </button>
          )}
          {requests.map((request) => (
            <button
              key={request.id}
              onClick={() => allocateItem(request)}
              className={`flex justify-between text-left px-2 py-1 rounded transition-all duration-200 ${item.allocation?.partner?.id === request.partner?.id ? "bg-blue-primary/20 hover:bg-red-primary/20" : "hover:bg-blue-primary/20"}`}
            >
              <p>{request.partner.name}</p>
              <p className="text-blue-primary pr-2">
                {request.itemsAllocated}/{request.quantity}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

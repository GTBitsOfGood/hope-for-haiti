import { useApiClient } from "@/hooks/useApiClient";
import { UnallocatedItemData } from "@/screens/AdminUnallocatedItemsScreen";
import { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { AdvancedBaseTableHandle } from "./baseTable/AdvancedBaseTable";
import Portal from "./baseTable/Portal";

export interface PartnerDistributionSummary {
  id: number;
  partnerId: number;
  partnerName: string;
  pending: boolean;
}

export default function LineItemChipGroup({
  items,
  requests,
  generalItemId,
  updateItem,
  updateItemsAllocated,
  ensureDistributionForPartner,
  onDistributionRemoved,
  isInteractionMode = false,
}: {
  items: UnallocatedItemData["items"];
  requests: UnallocatedItemData["requests"];
  generalItemId: number;
  updateItem: AdvancedBaseTableHandle<UnallocatedItemData>["updateItemById"];
  updateItemsAllocated: (itemId: number, partnerId: number) => void;
  ensureDistributionForPartner?: (
    partnerId: number,
    partnerName: string
  ) => Promise<PartnerDistributionSummary>;
  onDistributionRemoved?: (partnerId: number) => void;
  isInteractionMode?: boolean;
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
          ensureDistributionForPartner={ensureDistributionForPartner}
          onDistributionRemoved={onDistributionRemoved}
          isInteractionMode={isInteractionMode}
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
  ensureDistributionForPartner,
  onDistributionRemoved,
  isInteractionMode = false,
}: {
  item: UnallocatedItemData["items"][number];
  requests: UnallocatedItemData["requests"];
  generalItemId: number;
  updateItem: AdvancedBaseTableHandle<UnallocatedItemData>["updateItemById"];
  updateItemsAllocated: (partnerId: number) => void;
  ensureDistributionForPartner?: (
    partnerId: number,
    partnerName: string
  ) => Promise<PartnerDistributionSummary>;
  onDistributionRemoved?: (partnerId: number) => void;
  isInteractionMode?: boolean;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
    if (isInteractionMode) {
      toast("Finish interaction mode before making manual changes.");
      setIsDropdownOpen(false);
      return;
    }

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

    updateLineItemInTable({ allocation: null, suggestedAllocation: undefined });
    updateItemsAllocated(item.allocation.partner!.id);
    if (response.deletedDistribution) {
      onDistributionRemoved?.(item.allocation.partner!.id);
    }
  }

  async function allocateItem(
    request: UnallocatedItemData["requests"][number]
  ) {
    if (isInteractionMode) {
      toast("Finish interaction mode before making manual changes.");
      setIsDropdownOpen(false);
      return;
    }

    if (item.allocation?.partner?.id === request.partnerId) {
      unallocateItem();
      return;
    }

    if (item.allocation?.id) {
      await unallocateItem();
    }

    // Handle allocation logic here
    setIsDropdownOpen(false);

    let distributionId: number | undefined;

    if (ensureDistributionForPartner) {
      const distribution = await ensureDistributionForPartner(
        request.partnerId,
        request.partner.name
      );
      distributionId = distribution.id;
    }

    const formData = new FormData();
    formData.set("partnerId", request.partnerId.toString());
    formData.set("lineItemId", item.id.toString());

    type AllocationResponse =
      | {
          allocation: {
            id: number;
            itemId: number;
            distributionId: number;
            partner: {
              id: number;
              name: string;
            } | null;
          };
        }
      | {
          id: number;
          itemId: number;
          distributionId: number;
          partner: {
            id: number;
            name: string;
          } | null;
        };

    const response = await apiClient.post<AllocationResponse>(
      distributionId
        ? `/api/distributions/${distributionId}/allocations`
        : "/api/allocations",
      {
        body:
          distributionId !== undefined
            ? formData
            : JSON.stringify({
                partnerId: request.partnerId,
                lineItem: item.id,
              }),
      }
    );

    const allocation =
      "allocation" in response ? response.allocation : response;

    toast.success(`Item allocated to ${request.partner.name} successfully!`);

    updateLineItemInTable({ allocation, suggestedAllocation: undefined });
    updateItemsAllocated(request.partnerId);
  }

  const suggestedAllocation = item.suggestedAllocation;
  const previousPartner = suggestedAllocation?.previousPartner ?? null;
  const nextPartner =
    suggestedAllocation?.nextPartner ?? item.allocation?.partner ?? null;
  const hasSuggestedChange =
    !!suggestedAllocation &&
    (previousPartner?.id ?? null) !== (nextPartner?.id ?? null);
  const hasSuggestedRemoval =
    hasSuggestedChange && nextPartner === null && previousPartner !== null;

  const currentPartnerLabel = nextPartner?.name ?? "None";
  const previousPartnerLabel = previousPartner?.name ?? "None";

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => {
          if (isInteractionMode) {
            return;
          }
          setIsDropdownOpen(!isDropdownOpen);
        }}
        className={`relative inline-flex items-center gap-2 px-3 py-1 text-sm rounded-lg border hover:shadow disabled:opacity-60 disabled:cursor-not-allowed m-2 ${
          hasSuggestedChange
            ? "border-blue-primary"
            : "border-blue-primary/60"
        }`}
        disabled={isInteractionMode}
      >
        <span className="text-blue-primary">{item.palletNumber}</span>
        <span className="rounded bg-blue-primary/20 text-blue-primary font-bold px-[2px]">
          {item.quantity}
        </span>
        <span className="absolute -left-2 -top-2 rounded overflow-clip text-xs shadow-sm bg-white">
          <span className="flex items-center gap-1 px-1 py-[1px] whitespace-nowrap">
            {hasSuggestedChange && (
              <span className="flex items-center gap-1 px-1 py-[1px] rounded bg-gray-primary/10 text-gray-primary/60 line-through">
                {previousPartnerLabel}
              </span>
            )}
            <span
              className={`flex items-center gap-1 px-1 py-[1px] rounded whitespace-nowrap ${
                hasSuggestedChange
                  ? "bg-blue-primary/20 text-blue-primary font-semibold"
                  : item.allocation
                    ? "bg-blue-primary/10 text-blue-primary"
                    : "bg-gray-primary/10 text-gray-primary/50"
              }`}
            >
              {hasSuggestedRemoval ? "None" : currentPartnerLabel}
            </span>
          </span>
        </span>
      </button>

      <Portal
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        triggerRef={buttonRef}
        position="bottom-left"
        className="w-48 bg-white border border-gray-primary/20 rounded shadow-lg p-2 text-sm font-bold"
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
      </Portal>
    </div>
  );
}

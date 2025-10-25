import { useApiClient } from "@/hooks/useApiClient";
import { toast } from "react-hot-toast";
import { AdvancedBaseTableHandle } from "./baseTable/AdvancedBaseTable";
import { AllocationTableItem } from "./allocationTable/types";
import Chip from "./Chip";

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
  items: AllocationTableItem["items"];
  requests: AllocationTableItem["requests"];
  generalItemId: number;
  updateItem: AdvancedBaseTableHandle<AllocationTableItem>["updateItemById"];
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
  item: AllocationTableItem["items"][number];
  requests: AllocationTableItem["requests"];
  generalItemId: number;
  updateItem: AdvancedBaseTableHandle<AllocationTableItem>["updateItemById"];
  updateItemsAllocated: (partnerId: number) => void;
  ensureDistributionForPartner?: (
    partnerId: number,
    partnerName: string
  ) => Promise<PartnerDistributionSummary>;
  onDistributionRemoved?: (partnerId: number) => void;
  isInteractionMode?: boolean;
}) {
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
      updateLineItemInTable({
        allocation: null,
      });

      const previousPartner = item.allocation?.partner ?? null;
      if (previousPartner) {
        updateItemsAllocated(previousPartner.id);
      }

      return;
    }

    if (!item.allocation?.id) {
      toast("Item is not allocated to any organization.");
      return;
    }

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
    if (response.deletedDistribution) {
      onDistributionRemoved?.(item.allocation.partner!.id);
    }
  }

  async function allocateItem(
    request: AllocationTableItem["requests"][number]
  ) {
    if (
      isInteractionMode &&
      item.allocation?.partner?.id === request.partnerId
    ) {
      await unallocateItem();
      return;
    }

    if (isInteractionMode) {
      const nextPartner = {
        id: request.partnerId,
        name: request.partner.name,
      };

      const previousPartner = item.allocation?.partner ?? null;

      updateLineItemInTable({
        allocation: {
          id: item.allocation?.id ?? -item.id,
          partner: nextPartner,
        },
      });

      if (previousPartner) {
        updateItemsAllocated(previousPartner.id);
      }
      updateItemsAllocated(request.partnerId);

      return;
    }

    if (item.allocation?.partner?.id === request.partnerId) {
      unallocateItem();
      return;
    }

    if (item.allocation?.id) {
      await unallocateItem();
    }

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

    updateLineItemInTable({ allocation });
    updateItemsAllocated(request.partnerId);
  }

  return (
    <div className="relative">
      <Chip
        className={
          item.allocation ? "border-blue-primary" : "border-blue-primary/60"
        }
        title={item.palletNumber ?? "Unknown Pallet"}
        revisedAmount={item.quantity}
        showLabel={true}
        label={item.allocation?.partner?.name}
        popover={
          <>
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
          </>
        }
      />
    </div>
  );
}

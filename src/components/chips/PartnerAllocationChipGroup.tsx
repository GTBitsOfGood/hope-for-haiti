"use client";

import { useEffect, useMemo, useState } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import toast from "react-hot-toast";
import AllocationChip from "./AllocationChip";
import {
  AllocationLineItem,
  AllocationTableItem,
} from "../allocationTable/types";
import { AdvancedBaseTableHandle } from "../baseTable/AdvancedBaseTable";
import { PartnerDistributionSummary } from "./LineItemChipGroup";

type Partner = { name: string; id: number };

export interface PartnerAllocationChipData {
  id: number;
  partner: Partner;
  requestedQuantity: number;
  allocatedQuantity: number;
}

export default function PartnerAllocationChipGroup({
  allocations,
  items,
  onChange,
  generalItemId,
  updateItem,
  updateItemsAllocated,
  ensureDistributionForPartner,
  onDistributionRemoved,
  isInteractionMode = false,
  readOnly = false,
}: {
  allocations: PartnerAllocationChipData[];
  items: AllocationLineItem[];
  onChange?: (updated: PartnerAllocationChipData[]) => void;
  generalItemId: number;
  updateItem: AdvancedBaseTableHandle<AllocationTableItem>["updateItemById"];
  updateItemsAllocated: (itemId: number, partnerId: number) => void;
  ensureDistributionForPartner?: (
    partnerId: number,
    partnerName: string
  ) => Promise<PartnerDistributionSummary>;
  onDistributionRemoved?: (partnerId: number) => void;
  isInteractionMode?: boolean;
  readOnly?: boolean;
}) {
  const [data, setData] = useState<PartnerAllocationChipData[]>(() =>
    allocations.map((r) => ({ ...r }))
  );

  useEffect(() => {
    setData(allocations.map((r) => ({ ...r })));
  }, [allocations]);

  useEffect(() => {
    onChange?.(data);
  }, [data, onChange]);

  const sorted = useMemo(
    () =>
      [...data].sort((a, b) => a.partner.name.localeCompare(b.partner.name)),
    [data]
  );

  return (
    <div className="w-full bg-gray-50 flex flex-wrap gap-2 p-3">
      {sorted.length === 0 ? (
        <p className="w-full text-center text-gray-500">No partner requests.</p>
      ) : (
        sorted.map((req) => (
          <PartnerAllocationChip
            key={req.id}
            allocation={req}
            generalItemId={generalItemId}
            isInteractionMode={isInteractionMode}
            updateItem={updateItem}
            updateItemsAllocated={(partnerId) =>
              updateItemsAllocated(generalItemId, partnerId)
            }
            ensureDistributionForPartner={ensureDistributionForPartner}
            onDistributionRemoved={onDistributionRemoved}
            readOnly={readOnly}
            items={items}
          />
        ))
      )}
    </div>
  );
}

function PartnerAllocationChip({
  allocation,
  items,
  readOnly = false,
}: {
  allocation: PartnerAllocationChipData;
  items: AllocationLineItem[];
  updateItem: AdvancedBaseTableHandle<AllocationTableItem>["updateItemById"];
  updateItemsAllocated: (partnerId: number) => void;
  ensureDistributionForPartner?: (
    partnerId: number,
    partnerName: string
  ) => Promise<PartnerDistributionSummary>;
  onDistributionRemoved?: (partnerId: number) => void;
  generalItemId: number;
  isInteractionMode?: boolean;
  readOnly?: boolean;
}) {
  const { apiClient } = useApiClient();

  async function allocateItem(item: AllocationLineItem) {
    const distributionId: number | undefined = undefined;
    /*
    if (ensureDistributionForPartner) {
      const distribution = await ensureDistributionForPartner(
        allocation.partner.id,
        allocation.partner.name
      );
      distributionId = distribution.id;
    }
      */

    const formData = new FormData();
    formData.set("partnerId", allocation.partner.id.toString());
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
                partnerId: allocation.partner.id,
                lineItem: item.id,
              }),
      }
    );

    const outputAllocation =
      "allocation" in response ? response.allocation : response;

    toast.success(
      `Item allocated to ${outputAllocation.partner?.name} successfully!`
    );
    /*
    updateLineItemInTable({ outputAllocation });
    updateItemsAllocated(request.partnerId);
    */
  }

  return (
    <AllocationChip
      title={allocation.partner.name}
      allocatedAmount={allocation.allocatedQuantity}
      requestedAmount={allocation.requestedQuantity}
      showLabel={false}
      popover={
        readOnly ? undefined : (
          <div className="text-sm font-bold">
            <p className="text-gray-500 mb-1">Allocate Line Item</p>
            <div className="flex flex-col overflow-y-scroll max-h-60 space-y-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => allocateItem(item)}
                  className={`relative flex justify-between text-left px-2 py-1 rounded transition-all duration-200 ${item.allocation?.partner?.id === allocation.partner?.id ? "bg-blue-primary/20 hover:bg-red-primary/20" : "hover:bg-blue-primary/20"}`}
                >
                  {item.allocation?.partner?.id === allocation.partner?.id && (
                    <span className="absolute -left-1 -top-1 rounded overflow-clip text-xs shadow-sm bg-white">
                      <span
                        className={`block max-w-[110px] h-full truncate px-1 py-[1px] bg-red-primary/20 text-red-primary`}
                      >
                        {allocation.partner.name}
                      </span>
                    </span>
                  )}
                  <p>{item.palletNumber}</p>
                  <p className="text-blue-primary pr-2">{item.quantity}</p>
                </button>
              ))}
            </div>
          </div>
        )
      }
    />
  );
}

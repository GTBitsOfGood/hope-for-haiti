"use client";

import { useCallback } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import AllocationTable from "@/components/allocationTable/AllocationTable";
import {
  AllocationChange,
  AllocationTableItem,
} from "@/components/allocationTable/types";
import { FilterList } from "@/components/baseTable/AdvancedBaseTable";

type SuggestionResponse = {
  allocations: { lineItemId: number; partnerId: number | null }[];
};

function calculateItemsAllocated(
  item: AllocationTableItem,
  request: AllocationTableItem["requests"][number]
) {
  return item.items
    .filter((line) => line.allocation?.partner?.id === request.partnerId)
    .reduce((sum, line) => sum + line.quantity, 0);
}

export default function AdminUnallocatedItemsScreen() {
  const { apiClient } = useApiClient();

  const fetchTableData = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<AllocationTableItem>
    ) => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        filters: JSON.stringify(filters),
      });

      const response = await apiClient.get<{
        items: AllocationTableItem[];
        total: number;
      }>(`/api/generalItems/unallocated?${params}`, {
        cache: "no-store",
      });

      const items = response.items.map((item) => ({
        ...item,
        requests: item.requests.map((request) => ({
          ...request,
          itemsAllocated: calculateItemsAllocated(item, request),
        })),
      }));

      return {
        data: items,
        total: response.total,
      };
    },
    [apiClient]
  );

  const handleSuggest = useCallback(
    async (items: AllocationTableItem[]) => {
      const generalItemIds = items.map((item) => item.id);
      if (!generalItemIds.length) {
        return { allocations: [] };
      }

      return apiClient.post<SuggestionResponse>("/api/suggest/allocations", {
        body: JSON.stringify({ generalItemIds }),
      });
    },
    [apiClient]
  );

  const handleApplySuggestions = useCallback(
    async (changes: AllocationChange[]) => {
      let appliedCount = 0;

      const removals = changes.filter(
        (change) =>
          change.previousAllocationId &&
          (change.previousPartner?.id ?? null) !==
            (change.nextPartner?.id ?? null)
      );

      const additions = changes.filter(
        (change) =>
          change.nextPartner &&
          (change.previousPartner?.id ?? null) !== change.nextPartner.id
      );

      await Promise.all(
        removals.map(async (change) => {
          await apiClient.delete<{ deletedDistribution: boolean }>(
            `/api/allocations/${change.previousAllocationId}`
          );
          appliedCount += 1;
        })
      );

      await Promise.all(
        additions.map(async (change) => {
          await apiClient.post("/api/allocations", {
            body: JSON.stringify({
              partnerId: change.nextPartner!.id,
              lineItem: change.lineItemId,
            }),
          });
          appliedCount += 1;
        })
      );

      return appliedCount;
    },
    [apiClient]
  );

  return (
    <>
      <h1 className="text-2xl font-semibold">Unallocated Items</h1>
      <AllocationTable
        fetchFn={fetchTableData}
        suggestionConfig={{
          onSuggest: handleSuggest,
          onApply: handleApplySuggestions,
        }}
      />
    </>
  );
}

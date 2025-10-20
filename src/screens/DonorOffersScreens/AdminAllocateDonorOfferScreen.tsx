"use client";

import { useRef, useCallback, useState } from "react";
import { CgChevronDown, CgChevronRight, CgSpinner } from "react-icons/cg";
import React from "react";
import { $Enums } from "@prisma/client";
import { useParams } from "next/navigation";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  ColumnDefinition,
} from "@/components/baseTable/AdvancedBaseTable";
import { useApiClient } from "@/hooks/useApiClient";
import LineItemChipGroup, {
  PartnerDistributionSummary,
} from "@/components/LineItemChipGroup";
import { useFetch } from "@/hooks/useFetch";
import toast from "react-hot-toast";
import Link from "next/link";
import { formatTableValue } from "@/utils/format";

export interface UnallocatedItemData {
  id: number;
  title: string;
  type: string;
  quantity: number;
  expirationDate: string | null;
  unitType: string;
  quantityPerUnit: number;
  requests: {
    id: number;
    partnerId: number;
    partner: {
      id: number;
      name: string;
    };
    createdAt: string;
    quantity: number;
    priority: $Enums.RequestPriority | null;
    comments: string;
    itemsAllocated: number;
  }[];
  items: {
    id: number;
    quantity: number;
    datePosted: string | null;
    donorName: string | null;
    lotNumber: string | null;
    palletNumber: string | null;
    boxNumber: string | null;
    allocation: {
      id: number;
      partner: {
        id: number;
        name: string;
      } | null;
    } | null;
    suggestedAllocation?: {
      previousPartner: {
        id: number;
        name: string;
      } | null;
      nextPartner: {
        id: number;
        name: string;
      } | null;
    };
  }[];
}

type AllocationSuggestion = {
  lineItemId: number;
  partnerId: number;
  partnerName: string;
};

function cloneItems(items: UnallocatedItemData[]): UnallocatedItemData[] {
  return items.map((item) => ({
    ...item,
    requests: item.requests.map((request) => ({
      ...request,
      partner: { ...request.partner },
    })),
    items: item.items.map((lineItem) => ({
      ...lineItem,
      allocation: lineItem.allocation
        ? {
            id: lineItem.allocation.id,
            partner: lineItem.allocation.partner
              ? { ...lineItem.allocation.partner }
              : null,
          }
        : null,
      suggestedAllocation: lineItem.suggestedAllocation
        ? {
            previousPartner: lineItem.suggestedAllocation.previousPartner
              ? { ...lineItem.suggestedAllocation.previousPartner }
              : null,
            nextPartner: lineItem.suggestedAllocation.nextPartner
              ? { ...lineItem.suggestedAllocation.nextPartner }
              : null,
          }
        : undefined,
    })),
  }));
}

function recomputeItemsAllocated(
  items: UnallocatedItemData[]
): UnallocatedItemData[] {
  return items.map((item) => ({
    ...item,
    requests: item.requests.map((request) => ({
      ...request,
      itemsAllocated: item.items
        .filter((line) => line.allocation?.partner?.id === request.partnerId)
        .reduce((sum, line) => sum + line.quantity, 0),
    })),
  }));
}

function buildPreviewAllocations(
  baseItems: UnallocatedItemData[],
  allocations: { lineItemId: number; partnerId: number }[]
): {
  previewItems: UnallocatedItemData[];
  suggestions: AllocationSuggestion[];
} {
  const previewItems = cloneItems(baseItems);

  const lineItemIndexMap = new Map<
    number,
    { itemIndex: number; lineIndex: number }
  >();
  previewItems.forEach((item, itemIndex) => {
    item.items.forEach((line, lineIndex) => {
      lineItemIndexMap.set(line.id, { itemIndex, lineIndex });
    });
  });

  const originalLineMap = new Map<number, UnallocatedItemData["items"][number]>();
  baseItems.forEach((item) => {
    item.items.forEach((line) => {
      originalLineMap.set(line.id, line);
    });
  });

  const partnerNameMap = new Map<number, string>();
  baseItems.forEach((item) => {
    item.requests.forEach((request) => {
      partnerNameMap.set(request.partnerId, request.partner.name);
    });
  });

  const suggestions: AllocationSuggestion[] = [];

  allocations.forEach(({ lineItemId, partnerId }) => {
    const location = lineItemIndexMap.get(lineItemId);
    if (!location) {
      return;
    }

    const originalLine = originalLineMap.get(lineItemId);
    const originalPartnerId = originalLine?.allocation?.partner?.id ?? null;
    if (originalPartnerId === partnerId) {
      return;
    }

    const partnerName = partnerNameMap.get(partnerId) ?? `Partner ${partnerId}`;

    const previewItem = previewItems[location.itemIndex];
    const previewLine = previewItem.items[location.lineIndex];
    previewLine.allocation = {
      id: -lineItemId,
      partner: {
        id: partnerId,
        name: partnerName,
      },
    };
    previewLine.suggestedAllocation = {
      previousPartner: originalLine?.allocation?.partner ?? null,
      nextPartner: previewLine.allocation.partner ?? null,
    };

    suggestions.push({
      lineItemId,
      partnerId,
      partnerName,
    });
  });

  const recomputed = recomputeItemsAllocated(previewItems);

  return {
    previewItems: recomputed,
    suggestions,
  };
}

export default function AdminAllocateDonorOfferScreen() {
  const tableRef = useRef<AdvancedBaseTableHandle<UnallocatedItemData>>(null);

  const { apiClient } = useApiClient();
  const params = useParams<{ donorOfferId: string }>();
  const donorOfferId = Number(params?.donorOfferId);
  const isValidDonorOfferId = Number.isFinite(donorOfferId);

  const [distributionsByPartner, setDistributionsByPartner] = useState<
    Record<number, PartnerDistributionSummary>
  >({});
  const currentItemsRef = useRef<UnallocatedItemData[]>([]);
  const preInteractionItemsRef = useRef<UnallocatedItemData[]>([]);
  const [isInteractionMode, setIsInteractionMode] = useState(false);
  const [isProcessingSuggestions, setIsProcessingSuggestions] = useState(false);
  const [isStreamComplete, setIsStreamComplete] = useState(false);
  const [suggestedAllocations, setSuggestedAllocations] =
    useState<AllocationSuggestion[]>([]);

  const { refetch: refetchDistributions } = useFetch<{
    distributions: Record<number, PartnerDistributionSummary>;
  }>(
    `/api/donorOffers/${donorOfferId}/distributions`,
    {
      conditionalFetch: isValidDonorOfferId,
      onSuccess: (data) => {
        if (!data?.distributions) {
          setDistributionsByPartner({});
          return;
        }

        const normalized = Object.entries(data.distributions).reduce(
          (acc, [partnerKey, distribution]) => {
            const partnerId = Number(partnerKey);
            acc[partnerId] = {
              ...distribution,
              partnerId,
            };
            return acc;
          },
          {} as Record<number, PartnerDistributionSummary>
        );

        setDistributionsByPartner(normalized);
      },
    }
  );

  function calculateItemsAllocated(
    item: UnallocatedItemData,
    request: UnallocatedItemData["requests"][number]
  ) {
    return item.items
      .filter((it) => it.allocation?.partner?.id === request.partnerId)
      .reduce((sum, it) => sum + it.quantity, 0);
  }

  const updateItemById = useCallback<
    AdvancedBaseTableHandle<UnallocatedItemData>["updateItemById"]
  >(
    (id, updater) => {
      if (!tableRef.current) {
        return;
      }

      let nextItem: UnallocatedItemData | undefined;

      tableRef.current.updateItemById(id, (current) => {
        const resolvedUpdate =
          typeof updater === "function"
            ? (
                updater as (
                  current: UnallocatedItemData
                ) =>
                  | Partial<UnallocatedItemData>
                  | UnallocatedItemData
                  | undefined
              )(current)
            : updater;

        if (resolvedUpdate === undefined) {
          nextItem = current;
          return current;
        }

        const mergedValue =
          typeof resolvedUpdate === "object" && !Array.isArray(resolvedUpdate)
            ? ({
                ...current,
                ...(resolvedUpdate as Partial<UnallocatedItemData>),
              } as UnallocatedItemData)
            : (resolvedUpdate as UnallocatedItemData);

        nextItem = mergedValue;
        return mergedValue;
      });

      if (!nextItem) {
        return;
      }

      currentItemsRef.current = currentItemsRef.current.map((item) =>
        item.id === id ? cloneItems([nextItem!])[0] : item
      );
    },
    []
  );

  const fetchTableData = useCallback(
    async () => {
      if (!isValidDonorOfferId) {
        return {
          data: [],
          total: 0,
        };
      }

      const res = await apiClient.get<{
        items: UnallocatedItemData[];
        total: number;
      }>(`/api/donorOffers/${donorOfferId}/allocationItems`, {
        cache: "no-store",
      });

      const items = res.items.map((item) => ({
        ...item,
        requests: item.requests.map((request) => ({
          ...request,
          itemsAllocated: calculateItemsAllocated(item, request),
        })),
      }));

      currentItemsRef.current = items;

      return {
        data: items,
        total: items.length,
      };
    },
    [apiClient, donorOfferId, isValidDonorOfferId]
  );

  function updateItemsAllocated(itemId: number, partnerId: number) {
    updateItemById(itemId, (prev) => ({
      ...prev,
      requests: prev.requests.map((request) =>
        request.partnerId === partnerId
          ? {
              ...request,
              itemsAllocated: calculateItemsAllocated(prev, request),
            }
          : request
      ),
    }));
  }

  const ensureDistributionForPartner = useCallback(
    async (partnerId: number, partnerName: string) => {
      const existing = distributionsByPartner[partnerId];
      if (existing) {
        return existing;
      }

      const body = new FormData();
      body.set("partnerId", partnerId.toString());
      body.set("pending", "true");

      const distribution = await apiClient.post<{
        id: number;
        partnerId: number;
        pending: boolean;
      }>("/api/distributions", {
        body,
      });

      const summary: PartnerDistributionSummary = {
        id: distribution.id,
        partnerId: distribution.partnerId,
        partnerName,
        pending: distribution.pending,
      };

      setDistributionsByPartner((prev) => ({
        ...prev,
        [partnerId]: summary,
      }));

      return summary;
    },
    [apiClient, distributionsByPartner]
  );

  const handleDistributionRemoved = useCallback((partnerId: number) => {
    setDistributionsByPartner((prev) => {
      if (!(partnerId in prev)) {
        return prev;
      }

      const updated = { ...prev };
      delete updated[partnerId];
      return updated;
    });
  }, []);

  const handleSuggestAllocations = useCallback(async () => {
    if (!isValidDonorOfferId) {
      toast.error("Invalid donor offer identifier");
      return;
    }

    if (!currentItemsRef.current.length) {
      toast("No items available for suggestions.");
      return;
    }

    if (isProcessingSuggestions) {
      return;
    }

    setIsInteractionMode(true);
    setIsProcessingSuggestions(true);
    setIsStreamComplete(false);
    setSuggestedAllocations([]);

    preInteractionItemsRef.current = cloneItems(currentItemsRef.current);

    try {
      const response = await apiClient.post<{
        allocations: { lineItemId: number; partnerId: number }[];
      }>("/api/suggest/finalized", {
        body: JSON.stringify({ donorOfferId }),
      });

      const allocationData = response.allocations ?? [];
      const { previewItems, suggestions } = buildPreviewAllocations(
        currentItemsRef.current,
        allocationData
      );

      if (!suggestions.length) {
        toast("No allocation changes suggested.");
        setIsInteractionMode(false);
        setIsStreamComplete(false);
        setSuggestedAllocations([]);
        return;
      }

      setSuggestedAllocations(suggestions);
      tableRef.current?.setItems(previewItems);
      currentItemsRef.current = previewItems;
      setIsStreamComplete(true);
    } catch (error) {
      console.error("Failed to suggest allocations", error);
      toast.error("Failed to suggest allocations");
      const restored = cloneItems(preInteractionItemsRef.current);
      tableRef.current?.setItems(restored);
      currentItemsRef.current = restored;
      setIsInteractionMode(false);
      setIsStreamComplete(false);
      setSuggestedAllocations([]);
    } finally {
      setIsProcessingSuggestions(false);
    }
  }, [
    apiClient,
    currentItemsRef,
    donorOfferId,
    isProcessingSuggestions,
    isValidDonorOfferId,
  ]);

  const handleUndo = useCallback(() => {
    const restored = cloneItems(preInteractionItemsRef.current);
    tableRef.current?.setItems(restored);
    currentItemsRef.current = restored;
    setIsInteractionMode(false);
    setIsStreamComplete(false);
    setSuggestedAllocations([]);
    preInteractionItemsRef.current = [];
  }, []);

  const handleKeep = useCallback(async () => {
    if (!suggestedAllocations.length) {
      toast("No suggested changes to keep.");
      setIsInteractionMode(false);
      setIsStreamComplete(false);
      return;
    }

    setIsProcessingSuggestions(true);

    const baselineLineMap = new Map<
      number,
      UnallocatedItemData["items"][number]
    >();
    preInteractionItemsRef.current.forEach((item) => {
      item.items.forEach((line) => {
        baselineLineMap.set(line.id, line);
      });
    });

    try {
      let appliedCount = 0;

      for (const suggestion of suggestedAllocations) {
        const baselineLine = baselineLineMap.get(suggestion.lineItemId);

        if (baselineLine?.allocation?.partner?.id === suggestion.partnerId) {
          continue;
        }

        if (baselineLine?.allocation?.id) {
          const response = await apiClient.delete<{
            deletedDistribution: boolean;
          }>(`/api/allocations/${baselineLine.allocation.id}`);

          if (response.deletedDistribution && baselineLine.allocation.partner) {
            handleDistributionRemoved(baselineLine.allocation.partner.id);
          }
        }

        const distribution = await ensureDistributionForPartner(
          suggestion.partnerId,
          suggestion.partnerName
        );

        const formData = new FormData();
        formData.set("partnerId", suggestion.partnerId.toString());
        formData.set("lineItemId", suggestion.lineItemId.toString());

        await apiClient.post(
          `/api/distributions/${distribution.id}/allocations`,
          {
            body: formData,
          }
        );

        appliedCount += 1;
      }

      if (appliedCount > 0) {
        toast.success(`Saved ${appliedCount} suggested allocation${
          appliedCount === 1 ? "" : "s"
        }.`);
      } else {
        toast("No allocation changes were applied.");
      }

      setIsInteractionMode(false);
      setIsStreamComplete(false);
      setSuggestedAllocations([]);
      preInteractionItemsRef.current = [];
      refetchDistributions();
      tableRef.current?.reload();
    } catch (error) {
      console.error("Failed to keep suggested allocations", error);
      toast.error("Failed to save suggested allocations");
    } finally {
      setIsProcessingSuggestions(false);
    }
  }, [
    apiClient,
    ensureDistributionForPartner,
    handleDistributionRemoved,
    refetchDistributions,
    suggestedAllocations,
  ]);

  const statusMessage = isProcessingSuggestions
    ? isStreamComplete
      ? "Saving suggestions..."
      : "Generating allocation suggestions..."
    : null;

  const columns: ColumnDefinition<UnallocatedItemData>[] = [
    {
      id: "title",
      header: "Title",
      cell: (item, _, isOpen) => (
        <span className="flex gap-2 items-center -ml-2">
          {isOpen ? <CgChevronDown /> : <CgChevronRight />}
          <p>{item.title || "N/A"}</p>
        </span>
      ),
    },
    "type",
    "quantity",
    {
      id: "expirationDate",
      header: "Expiration",
      cell: (item) => {
        return item.expirationDate
          ? new Date(item.expirationDate).toLocaleDateString()
          : "N/A";
      },
    },
    "unitType",
    "quantityPerUnit",
    {
      id: "requests",
      header: "# of Requests",
      cell: (item) => item.requests?.length,
      filterable: false,
    },
    {
      id: "items",
      header: "# of Line Items",
      cell: (item) => item.items?.length,
      filterable: false,
    },
  ];

  return (
    <>
      <div className="flex flex-row justify-between items-center mb-4">
        <div className="flex items-center gap-1">
          <Link
            href="/donorOffers"
            className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1"
          >
            Donor Offers
          </Link>
          <span className="text-gray-500 text-sm flex items-center">/</span>
          <span className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1">
            {formatTableValue(String(donorOfferId))}
          </span>
        </div>
      </div>

      <AdvancedBaseTable
        ref={tableRef}
        columns={columns}
        fetchFn={fetchTableData}
        rowId="id"
        pageSize={20}
        toolBar={
          !isInteractionMode ? (
            <button
              onClick={handleSuggestAllocations}
              className="px-4 py-2 bg-blue-primary text-white rounded hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isProcessingSuggestions}
            >
              {isProcessingSuggestions
                ? "Preparing suggestions..."
                : "Suggest Allocations"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {statusMessage && (
                <span className="text-blue-primary text-sm">
                  {statusMessage}
                </span>
              )}
              {isStreamComplete ? (
                <>
                  <button
                    onClick={handleUndo}
                    className="px-3 py-1 bg-gray-primary text-white rounded hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isProcessingSuggestions}
                  >
                    Undo
                  </button>
                  <button
                    onClick={handleKeep}
                    className="px-3 py-1 bg-green-primary text-white rounded hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isProcessingSuggestions}
                  >
                    Keep
                  </button>
                </>
              ) : (
                <button
                  onClick={handleUndo}
                  className="px-3 py-1 bg-gray-primary text-white rounded hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isProcessingSuggestions}
                >
                  Cancel
                </button>
              )}
            </div>
          )
        }
        rowBody={(item) => (
          <LineItemChipGroup
            items={item.items}
            requests={item.requests}
            generalItemId={item.id}
            updateItem={updateItemById}
            updateItemsAllocated={updateItemsAllocated}
            ensureDistributionForPartner={ensureDistributionForPartner}
            onDistributionRemoved={handleDistributionRemoved}
            isInteractionMode={isInteractionMode}
          />
        )}
        emptyState={
          <div className="flex justify-center items-center mt-8">
            <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
          </div>
        }
      />
    </>
  );
}

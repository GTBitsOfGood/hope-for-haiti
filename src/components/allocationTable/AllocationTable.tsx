"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { CgChevronDown, CgChevronRight } from "react-icons/cg";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  ColumnDefinition,
  FilterList,
} from "@/components/baseTable/AdvancedBaseTable";
import LineItemChipGroup, {
  PartnerDistributionSummary,
} from "@/components/chips/LineItemChipGroup";
import { toast } from "react-hot-toast";
import { AllocationChange, AllocationTableItem } from "./types";
import {
  buildPreviewAllocations,
  cloneAllocationItems,
  recomputeItemsAllocated,
} from "./utils";
import { AllocationSuggestionProgram } from "@/types/ui/allocationSuggestions";
import { solveAllocationPrograms } from "@/util/solveAllocationPrograms";

type SuggestionResponse = {
  programs: AllocationSuggestionProgram[];
};

type SuggestionConfig = {
  suggestLabel?: string;
  onSuggest: (items: AllocationTableItem[]) => Promise<SuggestionResponse>;
  onApply: (changes: AllocationChange[]) => Promise<number>;
  onAfterApply?: () => void;
};

export type AllocationTableProps = {
  fetchFn: (
    pageSize: number,
    page: number,
    filters: FilterList<AllocationTableItem>
  ) => Promise<{ data: AllocationTableItem[]; total: number }>;
  columns?: ColumnDefinition<AllocationTableItem>[];
  pageSize?: number;
  ensureDistributionForPartner?: (
    partnerId: number,
    partnerName: string
  ) => Promise<PartnerDistributionSummary>;
  onDistributionRemoved?: (partnerId: number) => void;
  suggestionConfig?: SuggestionConfig;
  toolBarExtras?: React.ReactNode;
  emptyState?: React.ReactNode;
};

function buildDefaultColumns(): ColumnDefinition<AllocationTableItem>[] {
  return [
    {
      id: "title",
      header: "Title",
      cell: (item, _index, isOpen) => (
        <span className="flex gap-2 items-center -ml-2">
          {isOpen ? <CgChevronDown /> : <CgChevronRight />}
          <p>{item.title || "N/A"}</p>
        </span>
      ),
    },
    "quantity",
    {
      id: "expirationDate",
      header: "Expiration",
      cell: (item) =>
        item.expirationDate
          ? new Date(item.expirationDate).toLocaleDateString()
          : "N/A",
    },
    "unitType",
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
}

export default function AllocationTable({
  fetchFn,
  columns,
  pageSize = 20,
  ensureDistributionForPartner,
  onDistributionRemoved,
  suggestionConfig,
  toolBarExtras,
  emptyState,
}: AllocationTableProps) {
  const tableRef = useRef<AdvancedBaseTableHandle<AllocationTableItem>>(null);
  const currentItemsRef = useRef<AllocationTableItem[]>([]);
  const preInteractionItemsRef = useRef<AllocationTableItem[]>([]);

  const [isInteractionMode, setIsInteractionMode] = useState(false);
  const [isProcessingSuggestions, setIsProcessingSuggestions] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const resolvedColumns = useMemo(
    () => columns ?? buildDefaultColumns(),
    [columns]
  );

  const resolvedEmptyState = useMemo(
    () =>
      emptyState ?? (
        <div className="flex flex-col items-center justify-center py-12 text-sm text-gray-500">
          <p>No items to display.</p>
        </div>
      ),
    [emptyState]
  );

  const wrappedFetchFn = useCallback<AllocationTableProps["fetchFn"]>(
    async (pageSizeArg, pageArg, filters) => {
      const result = await fetchFn(pageSizeArg, pageArg, filters);
      currentItemsRef.current = cloneAllocationItems(result.data);
      return result;
    },
    [fetchFn]
  );

  const updateItemById = useCallback<
    AdvancedBaseTableHandle<AllocationTableItem>["updateItemById"]
  >((id, updater) => {
    if (!tableRef.current) {
      return;
    }

    let nextItem: AllocationTableItem | undefined;

    tableRef.current.updateItemById(id, (current) => {
      const resolvedUpdate =
        typeof updater === "function"
          ? (
              updater as (
                current: AllocationTableItem
              ) =>
                | Partial<AllocationTableItem>
                | AllocationTableItem
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
              ...(resolvedUpdate as Partial<AllocationTableItem>),
            } as AllocationTableItem)
          : (resolvedUpdate as AllocationTableItem);

      nextItem = mergedValue;
      return mergedValue;
    });

    if (!nextItem) {
      return;
    }

    currentItemsRef.current = currentItemsRef.current.map((item) =>
      item.id === id ? cloneAllocationItems([nextItem!])[0] : item
    );
  }, []);

  const updateItemsAllocated = useCallback(
    (itemId: number, partnerId: number) => {
      updateItemById(itemId, (prev) => ({
        ...prev,
        requests: prev.requests.map((request) =>
          request.partnerId === partnerId
            ? {
                ...request,
                itemsAllocated: prev.items
                  .filter((line) => line.allocation?.partner?.id === partnerId)
                  .reduce((sum, line) => sum + line.quantity, 0),
              }
            : request
        ),
      }));
    },
    [updateItemById]
  );

  const handleSuggestAllocations = useCallback(async () => {
    if (!suggestionConfig) {
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
    setStatusMessage("Generating allocation suggestions...");
    preInteractionItemsRef.current = cloneAllocationItems(
      currentItemsRef.current
    );

    try {
      const response = await suggestionConfig.onSuggest(
        currentItemsRef.current
      );
      const programs = response.programs ?? [];

      if (!programs.length) {
        toast("No allocation changes suggested.");
        const recomputed = recomputeItemsAllocated(currentItemsRef.current);
        tableRef.current?.setItems(recomputed);
        currentItemsRef.current = recomputed;
        setIsInteractionMode(false);
        preInteractionItemsRef.current = [];
        return;
      }

      const allocationData = await solveAllocationPrograms(programs);

      const { previewItems, suggestions } = buildPreviewAllocations(
        currentItemsRef.current,
        allocationData
      );

      if (!suggestions.length) {
        toast("No allocation changes suggested.");
        setIsInteractionMode(false);
        const recomputed = recomputeItemsAllocated(currentItemsRef.current);
        tableRef.current?.setItems(recomputed);
        currentItemsRef.current = recomputed;
        preInteractionItemsRef.current = [];
        return;
      }

      tableRef.current?.setItems(previewItems);
      currentItemsRef.current = previewItems;
    } catch (error) {
      console.error("Failed to suggest allocations", error);
      toast.error("Failed to suggest allocations");
      const restored = cloneAllocationItems(preInteractionItemsRef.current);
      tableRef.current?.setItems(restored);
      currentItemsRef.current = restored;
      setIsInteractionMode(false);
      preInteractionItemsRef.current = [];
    } finally {
      setIsProcessingSuggestions(false);
      setStatusMessage(null);
    }
  }, [suggestionConfig, isProcessingSuggestions]);

  const handleUndo = useCallback(() => {
    const restored = cloneAllocationItems(preInteractionItemsRef.current);
    tableRef.current?.setItems(restored);
    currentItemsRef.current = restored;
    setIsInteractionMode(false);
    setStatusMessage(null);
    preInteractionItemsRef.current = [];
  }, []);

  const collectPendingChanges = useCallback((): AllocationChange[] => {
    const baselineLineMap = new Map<
      number,
      AllocationTableItem["items"][number]
    >();
    preInteractionItemsRef.current.forEach((item) => {
      item.items.forEach((line) => {
        baselineLineMap.set(line.id, line);
      });
    });

    const changes: AllocationChange[] = [];

    currentItemsRef.current.forEach((item) => {
      item.items.forEach((line) => {
        const baselineLine = baselineLineMap.get(line.id);
        const previousPartner = baselineLine?.allocation?.partner ?? null;
        const nextPartner = line.allocation?.partner ?? null;
        const previousPartnerId = previousPartner?.id ?? null;
        const nextPartnerId = nextPartner?.id ?? null;

        if (previousPartnerId === nextPartnerId) {
          return;
        }

        changes.push({
          lineItemId: line.id,
          previousPartner: previousPartner
            ? { id: previousPartner.id, name: previousPartner.name }
            : null,
          nextPartner: nextPartner
            ? { id: nextPartner.id, name: nextPartner.name }
            : null,
          previousAllocationId: baselineLine?.allocation?.id ?? null,
        });
      });
    });

    return changes;
  }, []);

  const handleKeep = useCallback(async () => {
    if (!suggestionConfig) {
      return;
    }

    const pendingChanges = collectPendingChanges();
    if (!pendingChanges.length) {
      toast("No suggested changes to keep.");
      setIsInteractionMode(false);
      setStatusMessage(null);
      preInteractionItemsRef.current = [];
      return;
    }

    setIsProcessingSuggestions(true);
    setStatusMessage("Saving suggestions...");

    try {
      const appliedCount = await suggestionConfig.onApply(pendingChanges);

      if (appliedCount > 0) {
        toast.success(
          `Saved ${appliedCount} suggested allocation${
            appliedCount === 1 ? "" : "s"
          }.`
        );
      } else {
        toast("No allocation changes were applied.");
      }

      setIsInteractionMode(false);
      setStatusMessage(null);
      preInteractionItemsRef.current = [];
      suggestionConfig.onAfterApply?.();
    } catch (error) {
      console.error("Failed to keep suggested allocations", error);
      toast.error("Failed to save suggested allocations");
    } finally {
      setIsProcessingSuggestions(false);
      setStatusMessage(null);
    }
  }, [collectPendingChanges, suggestionConfig]);

  const toolbarContent = suggestionConfig ? (
    !isInteractionMode ? (
      <div className="flex items-center gap-2">
        <button
          onClick={handleSuggestAllocations}
          className="px-4 py-2 bg-blue-primary text-white rounded hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isProcessingSuggestions}
        >
          {isProcessingSuggestions
            ? "Preparing suggestions..."
            : (suggestionConfig.suggestLabel ?? "Suggest Allocations")}
        </button>
        {toolBarExtras}
      </div>
    ) : (
      <div className="flex items-center gap-2">
        {statusMessage && (
          <span className="text-blue-primary text-sm">{statusMessage}</span>
        )}
        {!isProcessingSuggestions ? (
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
        {toolBarExtras}
      </div>
    )
  ) : (
    (toolBarExtras ?? undefined)
  );

  return (
    <AdvancedBaseTable
      ref={tableRef}
      columns={resolvedColumns}
      fetchFn={wrappedFetchFn}
      rowId="id"
      pageSize={pageSize}
      toolBar={toolbarContent}
      rowBody={(item) => (
        <LineItemChipGroup
          items={item.items}
          requests={item.requests}
          generalItemId={item.id}
          updateItem={updateItemById}
          updateItemsAllocated={updateItemsAllocated}
          ensureDistributionForPartner={ensureDistributionForPartner}
          onDistributionRemoved={onDistributionRemoved}
          isInteractionMode={isInteractionMode}
        />
      )}
      emptyState={resolvedEmptyState}
    />
  );
}

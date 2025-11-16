"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import ToggleViewSwitch from "../ToggleViewSwitch";
import PartnerAllocationChipGroup from "../chips/PartnerAllocationChipGroup";

type SuggestionResponse = {
  programs: AllocationSuggestionProgram[];
};

type SuggestionConfig = {
  suggestLabel?: string;
  onSuggest: (items: AllocationTableItem[]) => Promise<SuggestionResponse>;
  onApply: (changes: AllocationChange[]) => Promise<number>;
  onAfterApply?: () => void;
  onModifiedPagesChange?: (pageCount: number) => void;
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
  // Full cache of all items across all pages (for interaction mode)
  const fullItemsCacheRef = useRef<Map<number, AllocationTableItem>>(new Map());

  const [isInteractionMode, setIsInteractionMode] = useState(false);
  const [isProcessingSuggestions, setIsProcessingSuggestions] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"partner" | "allocation">(
    "partner"
  );

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("ALLOCATION_VIEW_TYPE");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed === "partner" || parsed === "allocation") {
          setActiveView(parsed);
        }
      } catch {
        // Invalid stored value, ignore
      }
    }
  }, []);

  // Save to localStorage when activeView changes
  useEffect(() => {
    localStorage.setItem("ALLOCATION_VIEW_TYPE", JSON.stringify(activeView));
  }, [activeView]);

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
      let items = cloneAllocationItems(result.data);

      if (isInteractionMode) {
        const baselineLineMap = new Map<
          number,
          AllocationTableItem["items"][number]
        >();
        preInteractionItemsRef.current.forEach((item) => {
          item.items.forEach((line) => {
            baselineLineMap.set(line.id, line);
          });
        });

        // Merge fresh data with cached items (preserving suggested changes)
        items = items.map((freshItem) => {
          const cachedItem = fullItemsCacheRef.current.get(freshItem.id);
          if (cachedItem) {
            return {
              ...freshItem,
              items: freshItem.items.map((freshLine) => {
                const cachedLine = cachedItem.items.find(
                  (l) => l.id === freshLine.id
                );
                if (cachedLine) {
                  const baselineLine = baselineLineMap.get(freshLine.id);
                  const baselineAllocation = baselineLine?.allocation ?? null;
                  const cachedAllocation = cachedLine.allocation;

                  const baselinePartnerId =
                    baselineAllocation?.partner?.id ?? null;
                  const cachedPartnerId = cachedAllocation?.partner?.id ?? null;

                  if (baselinePartnerId !== cachedPartnerId) {
                    return {
                      ...freshLine,
                      allocation: cachedAllocation
                        ? {
                            id: cachedAllocation.id,
                            partner: cachedAllocation.partner
                              ? {
                                  id: cachedAllocation.partner.id,
                                  name: cachedAllocation.partner.name,
                                }
                              : null,
                          }
                        : null,
                    };
                  }
                }
                return freshLine;
              }),
            };
          }
          return freshItem;
        });

        items = recomputeItemsAllocated(items);

        // Update the full cache with merged items
        items.forEach((item) => {
          fullItemsCacheRef.current.set(
            item.id,
            cloneAllocationItems([item])[0]
          );
        });
      } else {
        // Not in interaction mode, clear the cache
        fullItemsCacheRef.current.clear();
      }

      currentItemsRef.current = items;
      return { data: items, total: result.total };
    },
    [fetchFn, isInteractionMode]
  );

  const updateItemById = useCallback<
    AdvancedBaseTableHandle<AllocationTableItem>["updateItemById"]
  >(
    (id, updater) => {
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

      const clonedItem = cloneAllocationItems([nextItem!])[0];
      currentItemsRef.current = currentItemsRef.current.map((item) =>
        item.id === id ? clonedItem : item
      );

      // Update cache if in interaction mode
      if (isInteractionMode && typeof id === "number") {
        fullItemsCacheRef.current.set(id, clonedItem);
      }
    },
    [isInteractionMode]
  );

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

  const fetchAllItems = useCallback(async (): Promise<
    AllocationTableItem[]
  > => {
    const allItems: AllocationTableItem[] = [];
    const emptyFilters: FilterList<AllocationTableItem> = {};

    const firstPageResult = await fetchFn(pageSize, 1, emptyFilters);
    const total = firstPageResult.total;
    allItems.push(...cloneAllocationItems(firstPageResult.data));

    const totalPages = Math.ceil(total / pageSize);
    if (totalPages > 1) {
      const remainingPages = Array.from(
        { length: totalPages - 1 },
        (_, i) => i + 2
      );

      const remainingResults = await Promise.all(
        remainingPages.map((page) => fetchFn(pageSize, page, emptyFilters))
      );

      remainingResults.forEach((result) => {
        allItems.push(...cloneAllocationItems(result.data));
      });
    }

    return allItems;
  }, [fetchFn, pageSize]);

  const handleSuggestAllocations = useCallback(async () => {
    if (!suggestionConfig) {
      return;
    }

    if (isProcessingSuggestions) {
      return;
    }

    setIsInteractionMode(true);
    setIsProcessingSuggestions(true);
    setStatusMessage("Fetching all items...");

    try {
      const allItems = await fetchAllItems();

      if (!allItems.length) {
        toast("No items available for suggestions.");
        setIsInteractionMode(false);
        setIsProcessingSuggestions(false);
        setStatusMessage(null);
        return;
      }

      preInteractionItemsRef.current = cloneAllocationItems(allItems);

      setStatusMessage("Generating allocation suggestions...");

      const response = await suggestionConfig.onSuggest(allItems);
      const programs = response.programs ?? [];

      if (!programs.length) {
        toast("No allocation changes suggested.");
        const recomputed = recomputeItemsAllocated(allItems);
        const start = 0;
        const paged = recomputed.slice(start, start + pageSize);
        tableRef.current?.setItems(paged);
        currentItemsRef.current = paged;
        recomputed.forEach((item) => {
          fullItemsCacheRef.current.set(
            item.id,
            cloneAllocationItems([item])[0]
          );
        });
        setIsInteractionMode(false);
        preInteractionItemsRef.current = [];
        fullItemsCacheRef.current.clear();

        // Notify parent that there are no modified pages
        if (suggestionConfig?.onModifiedPagesChange) {
          suggestionConfig.onModifiedPagesChange(0);
        }

        return;
      }

      const allocationData = await solveAllocationPrograms(programs);

      const { previewItems, suggestions } = buildPreviewAllocations(
        allItems,
        allocationData
      );

      if (!suggestions.length) {
        toast("No allocation changes suggested.");
        setIsInteractionMode(false);
        const recomputed = recomputeItemsAllocated(allItems);
        const start = 0;
        const paged = recomputed.slice(start, start + pageSize);
        tableRef.current?.setItems(paged);
        currentItemsRef.current = paged;
        recomputed.forEach((item) => {
          fullItemsCacheRef.current.set(
            item.id,
            cloneAllocationItems([item])[0]
          );
        });
        preInteractionItemsRef.current = [];
        fullItemsCacheRef.current.clear();

        if (suggestionConfig?.onModifiedPagesChange) {
          suggestionConfig.onModifiedPagesChange(0);
        }

        return;
      }

      // Populate cache with all preview items
      previewItems.forEach((item) => {
        fullItemsCacheRef.current.set(item.id, cloneAllocationItems([item])[0]);
      });

      const baselineLineMap = new Map<
        number,
        AllocationTableItem["items"][number]
      >();
      preInteractionItemsRef.current.forEach((item) => {
        item.items.forEach((line) => {
          baselineLineMap.set(line.id, line);
        });
      });

      const modifiedItemIds = new Set<number>();
      previewItems.forEach((item) => {
        const hasChanges = item.items.some((line) => {
          const baselineLine = baselineLineMap.get(line.id);
          const baselinePartnerId =
            baselineLine?.allocation?.partner?.id ?? null;
          const currentPartnerId = line.allocation?.partner?.id ?? null;
          return baselinePartnerId !== currentPartnerId;
        });
        if (hasChanges) {
          modifiedItemIds.add(item.id);
        }
      });

      // Calculate which pages have modifications
      const modifiedPages = new Set<number>();
      modifiedItemIds.forEach((itemId) => {
        const itemIndex = previewItems.findIndex((item) => item.id === itemId);
        if (itemIndex !== -1) {
          const page = Math.floor(itemIndex / pageSize) + 1;
          modifiedPages.add(page);
        }
      });

      // Notify parent of modified page count
      if (suggestionConfig?.onModifiedPagesChange) {
        suggestionConfig.onModifiedPagesChange(modifiedPages.size);
      }

      if (modifiedItemIds.size > 0) {
        tableRef.current?.setOpenRowIds((prev) => {
          const next = new Set(prev);
          modifiedItemIds.forEach((id) => next.add(id));
          return next;
        });
      }

      const start = 0;
      const paged = previewItems.slice(start, start + pageSize);
      tableRef.current?.setItems(paged);
      currentItemsRef.current = paged;
    } catch (error) {
      console.error("Failed to suggest allocations", error);
      toast.error("Failed to suggest allocations");
      if (preInteractionItemsRef.current.length > 0) {
        const restored = cloneAllocationItems(preInteractionItemsRef.current);
        const start = 0;
        const paged = restored.slice(start, start + pageSize);
        tableRef.current?.setItems(paged);
        currentItemsRef.current = paged;
      }
      setIsInteractionMode(false);
      preInteractionItemsRef.current = [];
      fullItemsCacheRef.current.clear();
    } finally {
      setIsProcessingSuggestions(false);
      setStatusMessage(null);
    }
  }, [suggestionConfig, isProcessingSuggestions, fetchAllItems, pageSize]);

  const handleUndo = useCallback(() => {
    const restored = cloneAllocationItems(preInteractionItemsRef.current);
    const start = 0;
    const paged = restored.slice(start, start + pageSize);
    tableRef.current?.setItems(paged);
    currentItemsRef.current = paged;
    fullItemsCacheRef.current.clear();
    setIsInteractionMode(false);
    setStatusMessage(null);
    preInteractionItemsRef.current = [];

    // Notify parent that there are no modified pages
    if (suggestionConfig?.onModifiedPagesChange) {
      suggestionConfig.onModifiedPagesChange(0);
    }

    tableRef.current?.reload();
  }, [pageSize, suggestionConfig]);

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

    // Collect changes from all cached items (all pages), not just current page
    fullItemsCacheRef.current.forEach((item) => {
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
      fullItemsCacheRef.current.clear();

      // Notify parent that there are no modified pages
      if (suggestionConfig.onModifiedPagesChange) {
        suggestionConfig.onModifiedPagesChange(0);
      }

      suggestionConfig.onAfterApply?.();
    } catch (error) {
      console.error("Failed to keep suggested allocations", error);
      toast.error("Failed to save suggested allocations");
    } finally {
      setIsProcessingSuggestions(false);
      setStatusMessage(null);
    }
  }, [collectPendingChanges, suggestionConfig]);

  const toolbarContent = (
    <>
      <div className="mr-auto flex items-center">
        <ToggleViewSwitch
          view={activeView}
          onChange={(v) => setActiveView(v)}
        />
      </div>
      {suggestionConfig ? (
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
      )}
    </>
  );

  const renderRowBody = useCallback(
    (item: AllocationTableItem) => {
      if (activeView === "allocation") {
        return (
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
        );
      } else if (activeView === "partner") {
        return (
          <PartnerAllocationChipGroup
            allocations={item.requests.map((x) => {
              return {
                id: x.id,
                partner: x.partner,
                requestedQuantity: x.quantity,
                allocatedQuantity: x.itemsAllocated,
              };
            })}
            items={item.items}
            generalItemId={item.id}
            updateItem={updateItemById}
            updateItemsAllocated={updateItemsAllocated}
            ensureDistributionForPartner={ensureDistributionForPartner}
            onDistributionRemoved={onDistributionRemoved}
            isInteractionMode={isInteractionMode}
          />
        );
      }
    },
    [
      activeView,
      ensureDistributionForPartner,
      isInteractionMode,
      onDistributionRemoved,
      updateItemById,
      updateItemsAllocated,
    ]
  );

  return (
    <AdvancedBaseTable
      ref={tableRef}
      columns={resolvedColumns}
      fetchFn={wrappedFetchFn}
      rowId="id"
      pageSize={pageSize}
      toolBar={toolbarContent}
      rowBody={renderRowBody}
      emptyState={resolvedEmptyState}
    />
  );
}

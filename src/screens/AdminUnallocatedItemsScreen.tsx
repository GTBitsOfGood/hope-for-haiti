"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import AllocationTable from "@/components/allocationTable/AllocationTable";
import {
  AllocationChange,
  AllocationTableItem,
} from "@/components/allocationTable/types";
import { FilterList } from "@/components/baseTable/AdvancedBaseTable";
import { AllocationSuggestionProgram } from "@/types/ui/allocationSuggestions";
import Tutorial, { type TutorialStep } from "@/components/Tutorial";

type SuggestionResponse = {
  programs: AllocationSuggestionProgram[];
};

const UNALLOCATED_TUTORIAL_SAMPLE_ID = -990001;
const UNALLOCATED_TUTORIAL_SAMPLE_STEP_INDEX = 1;
const UNALLOCATED_TUTORIAL_SUGGEST_STEP_INDEX = 4;
const UNALLOCATED_TUTORIAL_ASSIGN_STEP_INDEX = 5;
const UNALLOCATED_TUTORIAL_SAMPLE_HIGHLIGHT_CLASS =
  "unallocated-items-tutorial-sample-highlight";
const UNALLOCATED_TUTORIAL_SUGGEST_HIGHLIGHT_CLASS =
  "unallocated-items-tutorial-suggest-highlight";
const TUTORIAL_TOOLTIP_SELECTOR = '[data-tutorial-tooltip="true"]';
const UNALLOCATED_TUTORIAL_SAMPLE_ITEM: AllocationTableItem = {
  id: UNALLOCATED_TUTORIAL_SAMPLE_ID,
  title: "Paracetamol 500mg",
  type: "MEDICATION",
  quantity: 1200,
  expirationDate: "2027-12-31T00:00:00.000Z",
  unitType: "BOTTLE",
  quantityPerUnit: 100,
  requests: [
    {
      id: -991001,
      partnerId: -992001,
      partner: {
        id: -992001,
        name: "Hope Medical Center",
      },
      createdAt: "2026-01-10T00:00:00.000Z",
      quantity: 300,
      finalQuantity: 300,
      priority: null,
      comments: "Tutorial request",
      itemsAllocated: 0,
    },
  ],
  items: [
    {
      id: -993001,
      quantity: 1200,
      datePosted: "2026-01-10T00:00:00.000Z",
      donorName: "Tutorial Donor",
      lotNumber: "TUT-LOT-01",
      palletNumber: "TUT-PALLET-01",
      boxNumber: "TUT-BOX-01",
      allocation: null,
    },
  ],
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
  const [modifiedPagesCount, setModifiedPagesCount] = useState(0);
  const hasUnallocatedTutorialEndedRef = useRef(false);
  const [isUnallocatedTutorialActive, setIsUnallocatedTutorialActive] =
    useState(true);
  const [hasUnallocatedTutorialEnded, setHasUnallocatedTutorialEnded] =
    useState(false);
  const isUnallocatedTutorialSampleMode =
    isUnallocatedTutorialActive && !hasUnallocatedTutorialEnded;

  const clearUnallocatedTutorialHighlights = useCallback(() => {
    document.body.classList.remove(UNALLOCATED_TUTORIAL_SAMPLE_HIGHLIGHT_CLASS);
    document.body.classList.remove(UNALLOCATED_TUTORIAL_SUGGEST_HIGHLIGHT_CLASS);
  }, []);

  const fetchTableData = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<AllocationTableItem>
    ) => {
      if (isUnallocatedTutorialSampleMode) {
        return {
          data: [UNALLOCATED_TUTORIAL_SAMPLE_ITEM],
          total: 1,
          meta: {
            orphanedRequests: [],
            generalItemOptions: [],
          },
        };
      }

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
    [apiClient, isUnallocatedTutorialSampleMode]
  );

  const handleSuggest = useCallback(
    async (items: AllocationTableItem[]) => {
      const generalItemIds = items.map((item) => item.id);
      if (!generalItemIds.length) {
        return { programs: [] };
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

  const tutorialSteps = useMemo<TutorialStep[]>(() => [
    {
      target: "body",
      title: <div>Manage Extra Inventory!</div>,
      content: (
        <div>
          View and allocate items that haven&apos;t been assigned to a specific
          distribution yet
        </div>
      ),
      placement: "center",
      isFixed: true,
    },
    {
      target: `[data-row-id="${UNALLOCATED_TUTORIAL_SAMPLE_ID}"]`,
      title: <div>Available for Allocation</div>,
      content: (
        <div>
          View the title, total quantity, and expiration dates of items in your
          surplus. Partners can see and request these items similar to initial
          donor offers.
        </div>
      ),
      placement: "left",
      isFixed: true,
      disableBeacon: true,
      spotlightPadding: 3,
    },
    {
      target: '[data-tutorial=\"unallocated-items-views\"]',
      title: <div>Toggle Views</div>,
      content: (
        <div>
          Use &apos;Allocation View&apos; to organize items by pallet, or switch
          to &apos;Partner View&apos; to see requests sorted by the specific
          partner who needs them.
        </div>
      ),
      placement: "left",
      isFixed: true,
      disableBeacon: true,
      spotlightPadding: 3,
    },
    {
      target: '[data-tutorial=\"unallocated-items-requests-nums\"]',
      title: <div>Track Incoming Requests</div>,
      content: (
        <div>
          Click this button to let the system suggest the best distribution plan
          based on partner wishlists and existing urgent needs.
        </div>
      ),
      placement: "left",
      isFixed: true,
      disableBeacon: true,
      spotlightPadding: 3,
    },
    {
      target: '[data-tutorial=\"unallocated-items-suggest-allocations\"]',
      title: <div>Suggest Allocations</div>,
      content: (
        <div>
          Click this button to let the system suggest the best distribution plan
          based on partner wishlists and existing urgent needs.
        </div>
      ),
      placement: "left",
      isFixed: true,
      disableBeacon: true,
      spotlightPadding: 2,
    },
    {
      target: `[data-row-id="${UNALLOCATED_TUTORIAL_SAMPLE_ID}"]`,
      title: <div>Assign to Distributions</div>,
      content: (
        <div>
          Unlike standard donor offers, these items are added directly to the
          partner’s most recent pending distribution once you finalize the
          allocation.
        </div>
      ),
      placement: "left",
      isFixed: true,
      disableBeacon: true,
      spotlightPadding: 3,
    },
    {
      target: "body",
      title: <div>Tutorial Completed: Unallocated Items</div>,
      content: (
        <div>
          You are now ready to manage surplus inventory and ensure every item
          reaches a partner in need!
        </div>
      ),
      placement: "center",
      isFixed: true,
      disableBeacon: true,
      spotlightPadding: 2,
    },
  ], []);

  const handleTutorialStepChange = useCallback((stepIndex: number) => {
    if (hasUnallocatedTutorialEndedRef.current || hasUnallocatedTutorialEnded) {
      return;
    }
    setIsUnallocatedTutorialActive(true);
    clearUnallocatedTutorialHighlights();

    if (
      stepIndex === UNALLOCATED_TUTORIAL_SAMPLE_STEP_INDEX ||
      stepIndex === UNALLOCATED_TUTORIAL_ASSIGN_STEP_INDEX
    ) {
      document.body.classList.add(UNALLOCATED_TUTORIAL_SAMPLE_HIGHLIGHT_CLASS);
    }

    if (stepIndex === UNALLOCATED_TUTORIAL_SUGGEST_STEP_INDEX) {
      document.body.classList.add(UNALLOCATED_TUTORIAL_SUGGEST_HIGHLIGHT_CLASS);
    }
  }, [clearUnallocatedTutorialHighlights, hasUnallocatedTutorialEnded]);

  const handleTutorialEnd = useCallback(() => {
    hasUnallocatedTutorialEndedRef.current = true;
    setHasUnallocatedTutorialEnded(true);
    setIsUnallocatedTutorialActive(false);
    setModifiedPagesCount(0);
    clearUnallocatedTutorialHighlights();
  }, [clearUnallocatedTutorialHighlights]);

  useEffect(() => {
    if (!hasUnallocatedTutorialEnded) {
      return;
    }

    setIsUnallocatedTutorialActive(false);
    setModifiedPagesCount(0);
    clearUnallocatedTutorialHighlights();
  }, [clearUnallocatedTutorialHighlights, hasUnallocatedTutorialEnded]);

  useEffect(() => {
    if (!isUnallocatedTutorialActive || hasUnallocatedTutorialEnded) {
      return;
    }

    let pendingCleanupTimeout: number | null = null;

    const maybeScheduleCleanup = () => {
      const hasTooltip = Boolean(
        document.querySelector(TUTORIAL_TOOLTIP_SELECTOR)
      );

      if (hasTooltip) {
        if (pendingCleanupTimeout !== null) {
          window.clearTimeout(pendingCleanupTimeout);
          pendingCleanupTimeout = null;
        }
        return;
      }

      if (pendingCleanupTimeout !== null) {
        return;
      }

      pendingCleanupTimeout = window.setTimeout(() => {
        pendingCleanupTimeout = null;

        if (!document.querySelector(TUTORIAL_TOOLTIP_SELECTOR)) {
          hasUnallocatedTutorialEndedRef.current = true;
          setHasUnallocatedTutorialEnded(true);
          setIsUnallocatedTutorialActive(false);
          setModifiedPagesCount(0);
          clearUnallocatedTutorialHighlights();
        }
      }, 200);
    };

    maybeScheduleCleanup();

    const observer = new MutationObserver(maybeScheduleCleanup);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (pendingCleanupTimeout !== null) {
        window.clearTimeout(pendingCleanupTimeout);
      }
    };
  }, [
    clearUnallocatedTutorialHighlights,
    hasUnallocatedTutorialEnded,
    isUnallocatedTutorialActive,
  ]);

  useEffect(() => {
    return () => {
      clearUnallocatedTutorialHighlights();
    };
  }, [clearUnallocatedTutorialHighlights]);

  return (
    <>
      <Tutorial
        tutorialSteps={tutorialSteps}
        type="adminDashboard"
        repeatOnRefresh
        onStepChange={handleTutorialStepChange}
        onTutorialEnd={handleTutorialEnd}
      />
      <h1 className="text-2xl font-semibold">Unallocated Items</h1>

      {modifiedPagesCount > 0 && (
        <div className="mb-4 mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Suggestions have been made across{" "}
            <strong>{modifiedPagesCount}</strong> page
            {modifiedPagesCount === 1 ? "" : "s"}. Please review all pages to
            see all recommendations.
          </p>
        </div>
      )}

      <AllocationTable
        key={
          isUnallocatedTutorialSampleMode
            ? "unallocated-tutorial-sample"
            : "unallocated-live-data"
        }
        fetchFn={fetchTableData}
        requestsHeaderTutorialId="unallocated-items-requests-nums"
        suggestionConfig={{
          onSuggest: handleSuggest,
          onApply: handleApplySuggestions,
          onModifiedPagesChange: setModifiedPagesCount,
        }}
      />
    </>
  );
}

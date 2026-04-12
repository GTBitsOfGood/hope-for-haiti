"use client";

import { RequestPriority, User, Wishlist } from "@prisma/client";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  FilterList,
} from "@/components/baseTable/AdvancedBaseTable";
import { useApiClient } from "@/hooks/useApiClient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WishlistSummary from "@/components/WishlistSummary";
import { ChatTeardropText } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import PriorityTag from "@/components/tags/PriorityTag";
import Tutorial, { type TutorialStep } from "@/components/Tutorial";

type AdminWishlistRow = Wishlist & { partner: Pick<User, "name"> };

const WISHLIST_TUTORIAL_SAMPLE_ID = -990002;
const WISHLIST_TUTORIAL_SORT_STEP_INDEX = 2;
const WISHLIST_TUTORIAL_SAMPLE_ROW_STEP_INDEX = 3;
const WISHLIST_TUTORIAL_SAMPLE_ROW_TUTORIAL_ID = "wishlist-sample-request";
const WISHLIST_TUTORIAL_SAMPLE_ROW_HIGHLIGHT_CLASS =
  "wishlist-tutorial-sample-highlight";
const WISHLIST_TUTORIAL_TOOLTIP_SELECTOR = '[data-tutorial-tooltip="true"]';

const WISHLIST_TUTORIAL_SAMPLE_ROW: AdminWishlistRow = {
  id: WISHLIST_TUTORIAL_SAMPLE_ID,
  name: "Bar Soap",
  quantity: 30,
  priority: RequestPriority.HIGH,
  comments: "Preferably unscented bar soap",
  lastUpdated: new Date("2026-01-10T00:00:00.000Z"),
  partnerId: -992001,
  generalItemId: null,
  partner: {
    name: "Les Cayes Community Hospital",
  },
};

export default function AdminWishlistScreen() {
  const { apiClient } = useApiClient();
  const tableRef = useRef<AdvancedBaseTableHandle<AdminWishlistRow>>(null);
  const hasWishlistTutorialEndedRef = useRef(false);
  const [isWishlistTutorialActive, setIsWishlistTutorialActive] = useState(true);
  const [hasWishlistTutorialEnded, setHasWishlistTutorialEnded] = useState(false);
  const isWishlistTutorialSampleMode =
    isWishlistTutorialActive && !hasWishlistTutorialEnded;

  const fetch = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<AdminWishlistRow>
    ) => {
      if (isWishlistTutorialSampleMode) {
        return {
          data: [WISHLIST_TUTORIAL_SAMPLE_ROW],
          total: 1,
        };
      }

      const searchParams = new URLSearchParams();
      searchParams.append("pageSize", pageSize.toString());
      searchParams.append("page", page.toString());
      searchParams.append("filters", JSON.stringify(filters));

      const response = await apiClient.get<{
        wishlists: AdminWishlistRow[];
        total: number;
      }>(`/api/wishlists?${searchParams}`);

      return {
        data: response.wishlists,
        total: response.total,
      };
    },
    [apiClient, isWishlistTutorialSampleMode]
  );

  const tutorialSteps = useMemo<TutorialStep[]>(
    () => [
      {
        target: "body",
        title: <div>Welcome to your Wishlist!</div>,
        content: (
          <div>
            Your wishlist page is where you can view and manage your partners&apos;
            unfulfilled wishes.
          </div>
        ),
        placement: "center",
        isFixed: true,
      },
      {
        target: `[data-tutorial="wishlist-summarize-needs"]`,
        title: <div>Summarize Needs</div>,
        content: (
          <div>
            When enough data is collected, click here for an overview of the
            most requested items across your entire network.
          </div>
        ),
        placement: "left",
        isFixed: true,
        disableBeacon: true,
        spotlightPadding: 4,
      },
      {
        target: `[data-tutorial="wishlist-sort-requests"]`,
        title: <div>Sort Requests</div>,
        content: <div>Filter by item name, priority, quantity, or comments.</div>,
        placement: "left",
        isFixed: true,
        disableBeacon: true,
        spotlightPadding: 2,
      },
      {
        target: `[data-tutorial="${WISHLIST_TUTORIAL_SAMPLE_ROW_TUTORIAL_ID}"]`,
        title: <div>Understand the Request</div>,
        content: (
          <div>
            Each row shows a specific item, the requesting priority, quantity,
            and any comments. This data helps the system automatically prioritize
            older or more urgent needs during automatic allocation.
          </div>
        ),
        placement: "left",
        isFixed: true,
        disableBeacon: true,
        spotlightPadding: 2,
      },
      {
        target: "body",
        title: <div>Tutorial Completed: Wishlist</div>,
        content: <div>You are now ready to manage your wishlist!</div>,
        placement: "center",
        isFixed: true,
        disableBeacon: true,
        spotlightPadding: 2,
      },
    ],
    []
  );

  const handleTutorialStepChange = useCallback(
    (stepIndex: number) => {
      if (hasWishlistTutorialEndedRef.current || hasWishlistTutorialEnded) {
        return;
      }

      setIsWishlistTutorialActive(true);
      tableRef.current?.setFilterMenuOpen(
        stepIndex === WISHLIST_TUTORIAL_SORT_STEP_INDEX
      );
      document.body.classList.toggle(
        WISHLIST_TUTORIAL_SAMPLE_ROW_HIGHLIGHT_CLASS,
        stepIndex === WISHLIST_TUTORIAL_SAMPLE_ROW_STEP_INDEX
      );
    },
    [hasWishlistTutorialEnded]
  );

  const removeWishlistTutorialArtifacts = useCallback(() => {
    tableRef.current?.setFilterMenuOpen(false);
    document.body.classList.remove(WISHLIST_TUTORIAL_SAMPLE_ROW_HIGHLIGHT_CLASS);
    tableRef.current?.setItems((rows) =>
      rows.filter((row) => row.id !== WISHLIST_TUTORIAL_SAMPLE_ID)
    );
  }, []);

  const handleTutorialEnd = useCallback(() => {
    hasWishlistTutorialEndedRef.current = true;
    setHasWishlistTutorialEnded(true);
    setIsWishlistTutorialActive(false);
    removeWishlistTutorialArtifacts();
    tableRef.current?.reload();
  }, [removeWishlistTutorialArtifacts]);

  useEffect(() => {
    if (!hasWishlistTutorialEnded) {
      return;
    }

    setIsWishlistTutorialActive(false);
    removeWishlistTutorialArtifacts();
    tableRef.current?.reload();
  }, [hasWishlistTutorialEnded, removeWishlistTutorialArtifacts]);

  useEffect(() => {
    if (!isWishlistTutorialActive || hasWishlistTutorialEnded) {
      return;
    }

    let pendingCleanupTimeout: number | null = null;

    const maybeScheduleCleanup = () => {
      const hasTooltip = Boolean(
        document.querySelector(WISHLIST_TUTORIAL_TOOLTIP_SELECTOR)
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

        if (!document.querySelector(WISHLIST_TUTORIAL_TOOLTIP_SELECTOR)) {
          hasWishlistTutorialEndedRef.current = true;
          setHasWishlistTutorialEnded(true);
          setIsWishlistTutorialActive(false);
          removeWishlistTutorialArtifacts();
          tableRef.current?.reload();
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
    hasWishlistTutorialEnded,
    isWishlistTutorialActive,
    removeWishlistTutorialArtifacts,
  ]);

  useEffect(() => {
    return () => {
      document.body.classList.remove(WISHLIST_TUTORIAL_SAMPLE_ROW_HIGHLIGHT_CLASS);
    };
  }, []);

  return (
    <div className="pb-32">
      <Tutorial
        tutorialSteps={tutorialSteps}
        type="adminWishlist"
        onStepChange={handleTutorialStepChange}
        onTutorialEnd={handleTutorialEnd}
      />
      <h1 className="text-2xl font-bold text-gray-primary">Wishlists</h1>
      <WishlistSummary />
      <AdvancedBaseTable<AdminWishlistRow>
        ref={tableRef}
        columns={[
          {
            header: "Name",
            id: "name",
            cell: (wishlist) => wishlist.name,
          },
          {
            header: "Partner",
            id: "partner",
            cell: (wishlist) => wishlist.partner.name,
          },
          {
            header: "Priority",
            id: "priority",
            cell: (wishlist) => <PriorityTag priority={wishlist.priority} />,
          },
          {
            header: "Quantity",
            id: "quantity",
            cell: (wishlist) => wishlist.quantity,
          },
          {
            header: "Comments",
            id: "comments",
            cell: (wishlist) => (
              <div className="w-1/3 flex items-center justify-center">
                <ChatTeardropText
                  size={22}
                  className={
                    wishlist.comments ? "text-black" : "text-gray-primary/50"
                  }
                  data-tooltip-id={`wishlist-comment-${wishlist.id}`}
                  data-tooltip-content={
                    wishlist.comments ? wishlist.comments : "(no comment)"
                  }
                />
                {wishlist.comments && (
                  <Tooltip
                    id={`wishlist-comment-${wishlist.id}`}
                    className="max-w-64 whitespace-pre-wrap"
                  />
                )}
              </div>
            ),
          },
        ]}
        fetchFn={fetch}
        rowId="id"
        filterButtonAttributes={{ "data-tutorial": "wishlist-sort-requests" }}
        getRowAttributes={(wishlist) =>
          isWishlistTutorialSampleMode &&
          wishlist.id === WISHLIST_TUTORIAL_SAMPLE_ID
            ? { "data-tutorial": WISHLIST_TUTORIAL_SAMPLE_ROW_TUTORIAL_ID }
            : undefined
        }
      />
    </div>
  );
}

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import { $Enums, Wishlist } from "@prisma/client";
import { PencilSimple, ChatTeardropText, Trash } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  ColumnDefinition,
  FilterList,
  TableQuery,
} from "@/components/baseTable/AdvancedBaseTable";
import AddToWishlistModal, {
  AddToWishlistSuggestion,
} from "@/components/AddToWishlistModal";
import EditWishlistModal from "@/components/EditWishlistModal";
import DeleteWishlistModal from "@/components/DeleteWishlistModal";
import PriorityTag from "@/components/tags/PriorityTag";
import { Step } from "react-joyride";
import Tutorial from "@/components/Tutorial";

type WishlistItem = Wishlist;
type TutorialStep = Step & {
  mobilePlacement?: Step["placement"];
  mobilePlacementBreakpoint?: number;
};

type WishlistEditable = {
  id: number;
  name: string;
  quantity?: number | null;
  priority?: $Enums.RequestPriority;
  comments?: string | null;
};

type WishlistTutorialModalState = {
  step?: 1 | 2;
  form?: {
    name?: string;
    quantity?: number;
    priority?: $Enums.RequestPriority;
    comments?: string;
  };
  suggestions?: AddToWishlistSuggestion[];
  hardMatch?: boolean;
} | null;

const tutorialSteps: TutorialStep[] = [
  {
    target: "body",
    title: (
      <div>
        Welcome to your <span className="text-red-primary">Wishlists!</span>
      </div>
    ),
    content: (
      <div>
        Your <span className="text-red-primary">wishlists</span> page is where
        you can view and manage your unfulfilled wishes.
        <p className="py-1">
          <strong>New here? Take a quick tour of this page.</strong>
        </p>
      </div>
    ),
    placement: "center",
    isFixed: true,
  },
  {
    target: '[data-tutorial="filter-button"]',
    title: "Filter",
    content: "Click here to filter your wishlists.",
    placement: "left",
  },
  {
    target: '[data-tutorial="filter-expanded"]',
    title: "Filter",
    content: (
      <div>
        <p>Wishlists can be filtered by:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Title</li>
          <li>Quantity requested</li>
          <li>Priority</li>
          <li>Comment</li>
        </ul>
      </div>
    ),
    placement: "left",
    spotlightPadding: 0,
  },
  {
    target: '[data-tutorial="wishlist-add-button"]',
    title: "Adding a Wishlist",
    content:
      "This button lets you add a new wish when you cannot find an item you need.",
    placement: "left",
  },
  {
    target: '[data-tutorial="wishlist-modal"]',
    title: "Adding a Wishlist",
    content: (
      <div>
        <p className="mb-2">Let&apos;s create a wishlist item.</p>
        <strong>First, enter the item you wish you had.</strong>
      </div>
    ),
    placement: "left",
  },
  {
    target: '[data-tutorial="wishlist-title-input"]',
    title: "Adding a Wishlist",
    content:
      "For this example, we will enter Bottled Water Cases as the item title.",
    placement: "left",
    isFixed: true,
  },
  {
    target: '[data-tutorial="wishlist-suggestions"]',
    title: "Matches found!",
    content: (
      <div>
        <p className="mb-2">
          Sometimes the item you want is already available on the Items page.
        </p>
        <strong>
          This table appears when your title is similar to existing inventory.
          You can go to <span className="text-red-primary">Items</span> to request one of these instead.
        </strong>
      </div>
    ),
    placement: "left",
  },
  {
    target: '[data-tutorial="wishlist-modal"]',
    title: "Wish details",
    content: (
      <div>
        <p className="mb-2">Now let&apos;s add a few details to your wish.</p>
          <p className="mt-2">
            You can set:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Priority</li>
            <li>Quantity Requested</li>
            <li>Comments</li>
          </ul>
      </div>
    ),
    placement: "left",
    mobilePlacement: "center",
    mobilePlacementBreakpoint: 1200,
  },
  {
    target: '[data-tutorial="individual-item"]',
    title: "Wishes",
    content: (
      <div>
        <strong>This is an individual wish.</strong>
        <p className="mt-2">Each row includes a wish&apos;s:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Title</li>
          <li>Quantity requested</li>
          <li>Priority</li>
          <li>Comment</li>
        </ul>
      </div>
    ),
    placement: "bottom",
    spotlightPadding: 4,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="wishlist-manage"]',
    title: "Managing wishes",
    content:
      "Each wish also allows you to edit details later or delete it if it is no longer needed.",
    placement: "left",
    spotlightPadding: 4,
    disableBeacon: true,
  },
  {
    target: "body",
    title: (
      <div>
        Tutorial Completed: <span className="text-red-primary">Wishlists</span>
      </div>
    ),
    content: <div>You are now ready to create and manage your wishes.</div>,
    placement: "center",
  },
];

const tutorialSoftSuggestions: AddToWishlistSuggestion[] = [
  {
    id: -910001,
    title: "Bottled Water Cases",
    donorOfferId: null,
    similarity: 0.84,
    strength: "soft",
    quantity: 24,
  },
  {
    id: -910002,
    title: "Purified Water Bottles",
    donorOfferId: null,
    similarity: 0.76,
    strength: "soft",
    quantity: 16,
  },
];

export default function PartnerWishlistScreen({
  partnerId,
  readOnly = false,
}: {
  partnerId?: number;
  readOnly?: boolean;
}) {
  const endpoint = useMemo(
    () =>
      partnerId ? `/api/wishlists?partnerId=${partnerId}` : "/api/wishlists",
    [partnerId]
  );

  const { apiClient } = useApiClient();

  const tableRef = useRef<AdvancedBaseTableHandle<WishlistItem>>(null);
  const tutorialRowInsertedRef = useRef(false);
  const tutorialRowIdRef = useRef<number | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<WishlistEditable | null>(null);
  const [deleting, setDeleting] = useState<WishlistEditable | null>(null);
  const [tutorialModalState, setTutorialModalState] =
    useState<WishlistTutorialModalState>(null);

  const fetchFn = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<WishlistItem>
    ): Promise<TableQuery<WishlistItem>> => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        filters: JSON.stringify(filters ?? {}),
      });
      const url = endpoint.includes("?")
        ? `${endpoint}&${params}`
        : `${endpoint}?${params}`;
      const data = await apiClient.get<WishlistItem[]>(url);
      return { data, total: data.length };
    },
    [apiClient, endpoint]
  );

  const handleTutorialEnd = () => {
    tableRef.current?.setFilterMenuOpen(false);
    setIsCreateOpen(false);
    setTutorialModalState(null);
    setEditing(null);
    setDeleting(null);

    if (tutorialRowInsertedRef.current && tutorialRowIdRef.current != null) {
      tableRef.current?.removeItemById(tutorialRowIdRef.current);
      tutorialRowInsertedRef.current = false;
      tutorialRowIdRef.current = null;
    }
  };

  const handleTutorialStepChange = useCallback((stepIndex: number) => {
    if (readOnly) return;

    tableRef.current?.setFilterMenuOpen(stepIndex === 2);

    const shouldKeepAddModalOpen =
      stepIndex === 4 || stepIndex === 5 || stepIndex === 6 || stepIndex === 7;

    if (!shouldKeepAddModalOpen) {
      setIsCreateOpen(false);
      setTutorialModalState(null);
    }

    if (stepIndex === 4) {
      setIsCreateOpen(true);
      setTutorialModalState({
        step: 1,
        form: {
          name: "",
        },
        suggestions: [],
        hardMatch: false,
      });
      return;
    }

    if (stepIndex === 5) {
      setIsCreateOpen(true);
      setTutorialModalState({
        step: 1,
        form: {
          name: "Bottled Water Cases",
        },
        suggestions: [],
        hardMatch: false,
      });
      return;
    }

    if (stepIndex === 6) {
      setIsCreateOpen(true);
      setTutorialModalState({
        step: 1,
        form: {
          name: "Bottled Water Cases",
        },
        suggestions: tutorialSoftSuggestions,
        hardMatch: false,
      });
      return;
    }

    if (stepIndex === 7) {
      setIsCreateOpen(true);
      setTutorialModalState({
        step: 2,
        form: {
          name: "Bottled Water Cases",
          quantity: 12,
          priority: $Enums.RequestPriority.HIGH,
          comments: "Needed for community pantry distribution.",
        },
        suggestions: [],
        hardMatch: false,
      });
      return;
    }

    if (stepIndex === 8) {
      requestAnimationFrame(() => {
        const currentItems = tableRef.current?.getAllItems() ?? [];
        const hasTutorialRow = currentItems.some((item) => item.id === -999999);

        if (!hasTutorialRow) {
          const tutorialWishlist: WishlistItem = {
            id: -999999,
            name: "Bottled Water Cases",
            quantity: 12,
            priority: $Enums.RequestPriority.HIGH,
            comments: "Needed for community pantry distribution.",
            lastUpdated: new Date(),
            partnerId: 0,
            generalItemId: null,
          } as WishlistItem;

          tableRef.current?.setItems((items) => [tutorialWishlist, ...items]);
          tutorialRowInsertedRef.current = true;
          tutorialRowIdRef.current = tutorialWishlist.id;
        }
      });
      return;
    }
  }, [readOnly]);

  const openCreateModal = () => {
    if (readOnly) return;
    setTutorialModalState(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (item: WishlistItem) => {
    if (readOnly) return;
    setEditing({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      priority: item.priority,
      comments: item.comments,
    });
  };

  const openDeleteModal = (item: WishlistItem) => {
    if (readOnly) return;
    setDeleting({ id: item.id, name: item.name });
  };

  const onSaveEdit = async (updates: {
    id: number;
    quantity?: number;
    comments?: string;
  }) => {
    await apiClient.patch(`/api/wishlists/${updates.id}`, {
      body: JSON.stringify(updates),
    });
    tableRef.current?.updateItemById(updates.id, updates);
  };

  const onConfirmDelete = async (id: number) => {
    await apiClient.delete(`/api/wishlists/${id}`);
    tableRef.current?.removeItemById(id);
  };

  const columns: ColumnDefinition<WishlistItem>[] = [
    {
      id: "name",
      header: "Title",
      cell: (it) =>
        it.name || <span className="text-gray-400 italic">(untitled)</span>,
      filterType: "string",
    },
    {
      id: "quantity",
      header: "Quantity requested",
      cell: (it) => it.quantity,
      filterType: "number",
    },
    {
      id: "priority",
      header: "Priority",
      cell: (it) => <PriorityTag priority={it.priority} />,
      filterType: "string",
    },
    {
      id: "comments",
      header: "Comment",
      cell: (it) => {
        const text = it.comments || "";
        const hasComment = text.trim().length > 0;
        return (
          <div className="w-1/3 flex items-center justify-center">
            <ChatTeardropText
              size={22}
              className={hasComment ? "text-black" : "text-gray-300"}
              data-tooltip-id={`wishlist-comment-${it.id}`}
              data-tooltip-content={hasComment ? text : "(no comment)"}
            />
            {hasComment && (
              <Tooltip
                id={`wishlist-comment-${it.id}`}
                className="max-w-64 whitespace-pre-wrap"
              />
            )}
          </div>
        );
      },
      filterType: "string",
    },
    {
      id: "actions",
      header: "Manage",
      cell: (it, rowIndex) => (
        <div
          className="inline-flex gap-2"
          data-tutorial={
            rowIndex === 0 || it.id === tutorialRowIdRef.current
              ? "wishlist-manage"
              : undefined
          }
        >
          <button
            className={`border rounded-md size-7 flex items-center justify-center ${
              readOnly ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
            }`}
            onClick={() => !readOnly && openEditModal(it)}
            disabled={readOnly}
            title={readOnly ? "View only" : "Edit"}
          >
            <PencilSimple size={18} />
          </button>
          <button
            className={`border rounded-md size-7 flex items-center justify-center ${
              readOnly ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
            }`}
            onClick={() => !readOnly && openDeleteModal(it)}
            disabled={readOnly}
            title={readOnly ? "View only" : "Delete"}
          >
            <Trash size={18} />
          </button>
        </div>
      ),
    },
  ];

  const toolbar = !readOnly ? (
    <button
      data-tutorial="wishlist-add-button"
      onClick={openCreateModal}
      className="inline-flex items-center gap-2 text-sm md:text-base px-4 py-2 bg-red-primary text-white rounded-md shadow-sm hover:brightness-95 active:translate-y-px transition"
    >
      <span aria-hidden className="text-lg leading-none">
        +
      </span>
      Add item
    </button>
  ) : null;

  return (
    <div className="pb-32">
      {!readOnly && !partnerId && (
        <Tutorial
          tutorialSteps={tutorialSteps}
          type="wishlists"
          onStepChange={handleTutorialStepChange}
          onTutorialEnd={handleTutorialEnd}
        />
      )}

      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-semibold text-gray-primary mb-2">
          Wishlist
        </h1>
      </div>

      <AdvancedBaseTable<WishlistItem>
        ref={tableRef}
        columns={columns}
        fetchFn={fetchFn}
        rowId="id"
        pageSize={25}
        emptyState="No wishlist items found."
        toolBar={toolbar}
      />

      <AddToWishlistModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setTutorialModalState(null);
        }}
        onSave={async () => {
          tableRef.current?.reload();
          setIsCreateOpen(false);
          setTutorialModalState(null);
        }}
        tutorialState={tutorialModalState}
      />

      <EditWishlistModal
        isOpen={!!editing}
        item={editing}
        onClose={() => setEditing(null)}
        onSave={async (updates) => {
          await onSaveEdit(updates);
          setEditing(null);
        }}
      />

      <DeleteWishlistModal
        isOpen={!!deleting}
        itemName={deleting?.name}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await onConfirmDelete(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}

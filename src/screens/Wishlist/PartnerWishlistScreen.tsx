"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import { Wishlist, $Enums } from "@prisma/client";
import PriorityTag from "@/components/tags/PriorityTag";
import { PencilSimple, ChatTeardropText, Trash } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import toast from "react-hot-toast";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  ColumnDefinition,
  FilterList,
  TableQuery,
} from "@/components/baseTable/AdvancedBaseTable";
import AddToWishlistModal, {
  AddToWishlistForm,
} from "@/components/AddToWishlistModal";

type WishlistItem = Wishlist;
type WishlistPriority = $Enums.RequestPriority;

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

  // 🔹 Table ref so we can reload after creating an item
  const tableRef = useRef<AdvancedBaseTableHandle<WishlistItem>>(null);

  // 🔹 Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);

  // 🔹 Example unit size options (replace or fetch as needed)
  const unitSizeOptions = useMemo(
    () => [
      { label: "Box", value: "Box" },
      { label: "Bottle", value: "Bottle" },
      { label: "Pack", value: "Pack" },
      { label: "Case", value: "Case" },
    ],
    []
  );

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
      // API returns an array (adjust if you later return { wishlists, total })
      const data = await apiClient.get<WishlistItem[]>(url);
      return { data, total: data.length };
    },
    [apiClient, endpoint]
  );

  const openCreateModal = () => {
    if (readOnly) return;
    setIsCreateOpen(true);
  };

  const openEditModal = (item: WishlistItem) => {
    if (readOnly) return;
    toast(`Open edit modal for #${item.id} (to be implemented)`);
  };

  const openDeleteModal = (item: WishlistItem) => {
    if (readOnly) return;
    toast(`Open delete modal for #${item.id} (to be implemented)`);
  };

  const onCreateSave = async (values: AddToWishlistForm) => {
    try {
      setSavingCreate(true);
      // Backend can infer partnerId from auth; include here if required
      await apiClient.post("/api/wishlists", {
        body: JSON.stringify({
          ...values,
          partnerId, // remove if your API ignores this and derives from session
        }),
      });
      toast.success("Wishlist item created");
      setIsCreateOpen(false);
      tableRef.current?.reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingCreate(false);
    }
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
      id: "unitSize",
      header: "Unit Size",
      cell: (it) =>
        it.unitSize || (
          <span className="text-gray-400 italic">(unit size)</span>
        ),
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
      cell: (it) => <PriorityTag priority={it.priority as WishlistPriority} />,
      filterType: "enum",
      filterOptions: ["LOW", "MEDIUM", "HIGH"],
    },
    {
      id: "lastUpdated",
      header: "Last updated",
      cell: (it) =>
        it.lastUpdated ? new Date(it.lastUpdated).toLocaleDateString() : "-",
      filterType: "date",
    },
    {
      id: "comments",
      header: "Comment",
      cell: (it) => {
        const text = it.comments || "";
        const hasComment = text.trim().length > 0;
        return (
          <div className="flex items-center justify-center">
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
      cell: (it) => (
        <div className="flex gap-2">
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

      {/* Add to Wishlist modal */}
      <AddToWishlistModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={onCreateSave}
        unitSizeOptions={unitSizeOptions}
        saving={savingCreate}
      />
    </div>
  );
}

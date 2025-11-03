"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import { Wishlist, $Enums } from "@prisma/client";
import PriorityTag from "@/components/tags/PriorityTag";
import { PencilSimple, ChatTeardropText, Trash } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  ColumnDefinition,
  FilterList,
  TableQuery,
} from "@/components/baseTable/AdvancedBaseTable";
import AddToWishlistModal from "@/components/AddToWishlistModal";
import EditWishlistModal from "@/components/EditWishlistModal";
import DeleteWishlistModal from "@/components/DeleteWishlistModal";

type WishlistItem = Wishlist;
type WishlistPriority = $Enums.RequestPriority;

type WishlistEditable = {
  id: number;
  name: string; // Title (read-only)
  quantity?: number | null;
  comments?: string | null;
};

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
  const [editing, setEditing] = useState<WishlistEditable | null>(null);
  const [deleting, setDeleting] = useState<WishlistEditable | null>(null);

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
    setEditing({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
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
    tableRef.current?.updateItemById(updates.id, updates); // AdvancedBaseTable ref method
  };

  const onConfirmDelete = async (id: number) => {
    await apiClient.delete(`/api/wishlists/${id}`);
    tableRef.current?.removeItemById(id); // AdvancedBaseTable ref method
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
        onSave={async () => {
          tableRef.current?.reload();
          setIsCreateOpen(false);
        }}
      />
      {/* Edit Modal */}
      <EditWishlistModal
        isOpen={!!editing}
        item={editing}
        onClose={() => setEditing(null)}
        onSave={async (updates) => {
          await onSaveEdit(updates);
          setEditing(null);
        }}
      />

      {/* Delete Modal */}
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

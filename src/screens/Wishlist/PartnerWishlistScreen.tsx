"use client";

import { useMemo, useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { useApiClient } from "@/hooks/useApiClient";
import { Wishlist } from "@prisma/client";
import { $Enums } from "@prisma/client";
import { priorityOptions } from "@/types/api/wishlist.types";
import ModalTextField from "@/components/ModalTextField";
import ModalDropDown from "@/components/ModalDropDown";
import PriorityTag from "@/components/tags/PriorityTag";
import {
  Check,
  PencilSimple,
  X,
  ChatTeardropText,
  Trash,
} from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import CommentModal from "@/components/CommentModal";
import toast from "react-hot-toast";
import BaseTable from "@/components/baseTable/BaseTable";

type WishlistItem = Wishlist;
type WishlistPriority = $Enums.RequestPriority;

export default function PartnerWishlistScreen({
  partnerId,
  readOnly = false,
}: {
  partnerId?: number;
  readOnly?: boolean;
}) {
  const endpoint = useMemo(() => {
    // If partnerId provided (admin viewing a partner), query string is used
    return partnerId
      ? `/api/wishlists?partnerId=${partnerId}`
      : "/api/wishlists";
  }, [partnerId]);

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [editingIds, setEditingIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [originals, setOriginals] = useState<Map<number, WishlistItem>>(
    new Map()
  );

  const { refetch } = useFetch<WishlistItem[]>(endpoint, {
    cache: "no-store",
    onSuccess: (data) => {
      setItems(data);
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message);
      setItems([]);
    },
  });

  const { apiClient } = useApiClient();

  const isEditing = (id: number) => editingIds.has(id);
  const isDeleting = (id: number) => deletingIds.has(id);

  const startEdit = (id: number) => {
    if (readOnly) return;
    // Cancel any pending delete confirmation first
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    setEditingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Capture original snapshot once when editing begins
    if (!originals.has(id)) {
      const it = items.find((i) => i.id === id);
      if (it) {
        setOriginals((prev) => new Map(prev).set(id, { ...it }));
      }
    }
  };

  const startDelete = (id: number) => {
    if (readOnly) return;
    // Cancel any pending edit first
    cancelEdit(id);

    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const cancelDelete = (id: number) => {
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };
  const cancelEdit = (id: number, keepIfNew: boolean = false) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (!keepIfNew) {
      setNewIds((prev) => {
        if (prev.has(id)) {
          // New unsaved row: remove it entirely
          setItems((itemsPrev) => itemsPrev.filter((i) => i.id !== id));
          const next = new Set(prev);
          next.delete(id);
          return next;
        }
        return prev;
      });
      // Existing row: revert to original snapshot if present
      const original = originals.get(id);
      if (original) {
        setItems((prev) => prev.map((it) => (it.id === id ? original : it)));
      }
    }
    // Clear snapshot in all cases once we exit edit
    setOriginals((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const applyLocalChange = (id: number, patch: Partial<WishlistItem>) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? ({ ...it, ...patch } as WishlistItem) : it
      )
    );
  };

  const isItemComplete = (it: WishlistItem) => {
    const nameOk = typeof it.name === "string" && it.name.trim().length > 0;
    const unitOk =
      typeof it.unitSize === "string" && it.unitSize.trim().length > 0;
    const qtyOk = Number.isFinite(it.quantity) && it.quantity > 0;
    const prOk =
      it.priority === "LOW" ||
      it.priority === "MEDIUM" ||
      it.priority === "HIGH";
    // comments is optional
    return nameOk && unitOk && qtyOk && prOk;
  };

  const save = async (id: number) => {
    if (readOnly) return;
    const item = items.find((i) => i.id === id);
    if (!item) return;
    if (!isItemComplete(item)) {
      toast.error("Please fill out required fields before saving");
      return;
    }

    try {
      if (newIds.has(id)) {
        // Creating new item
        await apiClient.post("/api/wishlists", {
          body: JSON.stringify({
            name: item.name,
            unitSize: item.unitSize,
            quantity: item.quantity,
            priority: item.priority,
            comments: item.comments || "",
          }),
        });
        toast.success("Wishlist item created");
      } else {
        // Updating existing item
        await apiClient.patch(`/api/wishlists/${id}`, {
          body: JSON.stringify({
            name: item.name,
            unitSize: item.unitSize,
            quantity: item.quantity,
            priority: item.priority,
            comments: item.comments || "",
          }),
        });
        toast.success("Wishlist item updated");
      }

      setNewIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      cancelEdit(id, true);
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async (id: number) => {
    if (readOnly) return;
    try {
      await apiClient.delete(`/api/wishlists/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Wishlist item removed");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="pb-32">
      <CommentModal
        isOpen={activeCommentId !== null && isEditing(activeCommentId)}
        title={
          (items.find((i) => i.id === activeCommentId)?.name || "Item") +
          ": Comment"
        }
        initialValue={
          activeCommentId
            ? ((
                items.find((i) => i.id === activeCommentId) as WishlistItem & {
                  comments?: string;
                  comment?: string;
                }
              )?.comments ??
              (
                items.find((i) => i.id === activeCommentId) as WishlistItem & {
                  comments?: string;
                  comment?: string;
                }
              )?.comment ??
              "")
            : ""
        }
        onClose={() => {
          // Just close the comment modal; keep the row in edit mode
          setActiveCommentId(null);
        }}
        onSave={(val: string) => {
          if (activeCommentId !== null) {
            applyLocalChange(activeCommentId, { comments: val });
            // keep in edit mode; user can still hit Save row or cancel
          }
          setActiveCommentId(null);
        }}
      />
      <div className="flex items-start justify-between">
        <h1 className="text-xl font-semibold text-gray-primary mb-2">
          Wish list
        </h1>
        {!readOnly && (
          <button
            onClick={() => {
              const nextId = Math.max(0, ...items.map((i) => i.id)) + 1;
              setItems((prev) => [
                ...prev,
                {
                  id: nextId,
                  name: "",
                  unitSize: "",
                  quantity: 0,
                  priority: "LOW" as WishlistPriority,
                  comments: "",
                  partnerId: 0, // Will be set by backend
                  createdAt: new Date(),
                  updatedAt: new Date(),
                } as unknown as WishlistItem,
              ]);
              startEdit(nextId);
              setNewIds((prev) => {
                const next = new Set(prev);
                next.add(nextId);
                return next;
              });
            }}
            className="inline-flex items-center gap-2 text-sm md:text-base px-4 py-2 bg-red-primary text-white rounded-md shadow-sm hover:brightness-95 active:translate-y-px transition"
          >
            <span aria-hidden className="text-lg leading-none">
              +
            </span>
            Add item
          </button>
        )}
      </div>

      <BaseTable
        headers={[
          "Title",
          "Unit Size",
          "Quantity requested",
          "Priority",
          "Last updated",
          "Comment",
          "Manage",
        ]}
        rows={items.map((it) => {
          const lastUpdated = (it as WishlistItem & { updatedAt?: Date })
            .updatedAt
            ? new Date(
                (it as WishlistItem & { updatedAt?: Date }).updatedAt!
              ).toLocaleDateString()
            : new Date().toLocaleDateString();
          const isEditingItem = isEditing(it.id) && !isDeleting(it.id);
          const isDeletingItem = isDeleting(it.id);

          return {
            cells: isEditingItem
              ? [
                  // Editing mode - all input fields
                  <ModalTextField
                    key={`name-${it.id}`}
                    name="name"
                    placeholder="Title"
                    inputProps={{
                      defaultValue: it.name,
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        applyLocalChange(it.id, { name: e.target.value }),
                    }}
                  />,
                  <ModalTextField
                    key={`unitSize-${it.id}`}
                    name="unitSize"
                    placeholder="Unit Size"
                    inputProps={{
                      defaultValue: it.unitSize,
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        applyLocalChange(it.id, { unitSize: e.target.value }),
                    }}
                  />,
                  <ModalTextField
                    key={`quantity-${it.id}`}
                    name="quantity"
                    type="number"
                    placeholder="Qty"
                    inputProps={{
                      defaultValue: it.quantity,
                      min: 0,
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        applyLocalChange(it.id, {
                          quantity: Number(e.target.value),
                        }),
                    }}
                  />,
                  <ModalDropDown
                    key={`priority-${it.id}-${it.priority}`}
                    name="priority"
                    placeholder="Priority"
                    options={priorityOptions}
                    required
                    defaultSelected={{
                      label:
                        it.priority.charAt(0) +
                        it.priority.slice(1).toLowerCase(),
                      value: it.priority,
                    }}
                    renderOption={(opt) => <PriorityTag priority={opt.value} />}
                    renderValue={(opt) => <PriorityTag priority={opt.value} />}
                    onSelect={(value: string) =>
                      applyLocalChange(it.id, {
                        priority: value as WishlistPriority,
                      })
                    }
                  />,
                  lastUpdated,
                  <button
                    key={`comment-${it.id}`}
                    type="button"
                    onClick={() => setActiveCommentId(it.id)}
                    className="rounded-full size-8 flex items-center justify-center border transition-colors hover:bg-gray-100"
                    title="Edit comment"
                  >
                    <ChatTeardropText size={22} className="text-blue-500" />
                  </button>,
                  <div key={`actions-${it.id}`} className="flex gap-2">
                    <button
                      className="border border-red-primary rounded-md size-7 flex items-center justify-center"
                      onClick={() => cancelEdit(it.id)}
                      title="Cancel"
                    >
                      <X className="text-red-primary" size={18} />
                    </button>
                    <button
                      className={`bg-blue-primary rounded-md size-7 flex items-center justify-center text-white ${!isItemComplete(it) ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => {
                        if (!isItemComplete(it)) return;
                        save(it.id);
                      }}
                      disabled={!isItemComplete(it)}
                      title={
                        isItemComplete(it)
                          ? "Save"
                          : "Fill required fields to save"
                      }
                    >
                      <Check size={18} />
                    </button>
                  </div>,
                ]
              : isDeletingItem
                ? [
                    // Deleting mode - show data with delete confirmation
                    <span key={`delete-name-${it.id}`}>
                      {it.name || (
                        <span className="text-gray-400 italic">(untitled)</span>
                      )}
                    </span>,
                    <span key={`delete-unitSize-${it.id}`}>
                      {it.unitSize || (
                        <span className="text-gray-400 italic">
                          (unit size)
                        </span>
                      )}
                    </span>,
                    <span key={`delete-quantity-${it.id}`}>{it.quantity}</span>,
                    <PriorityTag
                      key={`delete-priority-${it.id}`}
                      priority={it.priority}
                    />,
                    lastUpdated,
                    <div key={`delete-comment-${it.id}`}>
                      <ChatTeardropText
                        data-tooltip-id={`wishlist-comment-${it.id}`}
                        data-tooltip-content={
                          (
                            it as WishlistItem & {
                              comments?: string;
                              comment?: string;
                            }
                          ).comments ||
                          (
                            it as WishlistItem & {
                              comments?: string;
                              comment?: string;
                            }
                          ).comment ||
                          ""
                        }
                        size={22}
                        className={`${(it as WishlistItem & { comments?: string; comment?: string }).comments || (it as WishlistItem & { comments?: string; comment?: string }).comment ? "text-black" : "text-gray-300"}`}
                      />
                      {((
                        it as WishlistItem & {
                          comments?: string;
                          comment?: string;
                        }
                      ).comments ||
                        (
                          it as WishlistItem & {
                            comments?: string;
                            comment?: string;
                          }
                        ).comment) && (
                        <Tooltip
                          key={`wishlist-comment-${it.id}-${(it as WishlistItem & { comments?: string; comment?: string }).comments || (it as WishlistItem & { comments?: string; comment?: string }).comment}`}
                          id={`wishlist-comment-${it.id}`}
                          className="max-w-64 whitespace-pre-wrap"
                        />
                      )}
                    </div>,
                    <div key={`delete-actions-${it.id}`} className="flex gap-2">
                      <button
                        className="border border-gray-400 rounded-md size-7 flex items-center justify-center"
                        onClick={() => cancelDelete(it.id)}
                        title="Cancel Delete"
                      >
                        <X className="text-gray-600" size={18} />
                      </button>
                      <button
                        className="bg-red-primary rounded-md size-7 flex items-center justify-center text-white"
                        onClick={() => remove(it.id)}
                        title="Confirm Delete"
                      >
                        <Check size={18} />
                      </button>
                    </div>,
                  ]
                : [
                    <span key={`view-name-${it.id}`}>
                      {it.name || (
                        <span className="text-gray-400 italic">(untitled)</span>
                      )}
                    </span>,
                    <span key={`view-unitSize-${it.id}`}>
                      {it.unitSize || (
                        <span className="text-gray-400 italic">
                          (unit size)
                        </span>
                      )}
                    </span>,
                    <span key={`view-quantity-${it.id}`}>{it.quantity}</span>,
                    <PriorityTag
                      key={`view-priority-${it.id}`}
                      priority={it.priority}
                    />,
                    lastUpdated,
                    <div key={`view-comment-${it.id}`}>
                      <ChatTeardropText
                        data-tooltip-id={`wishlist-comment-${it.id}`}
                        data-tooltip-content={
                          (
                            it as WishlistItem & {
                              comments?: string;
                              comment?: string;
                            }
                          ).comments ||
                          (
                            it as WishlistItem & {
                              comments?: string;
                              comment?: string;
                            }
                          ).comment ||
                          ""
                        }
                        size={22}
                        className={`${(it as WishlistItem & { comments?: string; comment?: string }).comments || (it as WishlistItem & { comments?: string; comment?: string }).comment ? "text-black" : "text-gray-300"}`}
                      />
                      {((
                        it as WishlistItem & {
                          comments?: string;
                          comment?: string;
                        }
                      ).comments ||
                        (
                          it as WishlistItem & {
                            comments?: string;
                            comment?: string;
                          }
                        ).comment) && (
                        <Tooltip
                          key={`wishlist-comment-${it.id}-${(it as WishlistItem & { comments?: string; comment?: string }).comments || (it as WishlistItem & { comments?: string; comment?: string }).comment}`}
                          id={`wishlist-comment-${it.id}`}
                          className="max-w-64 whitespace-pre-wrap"
                        />
                      )}
                    </div>,
                    <div key={`view-actions-${it.id}`} className="flex gap-2">
                      <button
                        className={`border rounded-md size-7 flex items-center justify-center ${readOnly ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
                        onClick={() => {
                          if (readOnly) return;
                          startEdit(it.id);
                        }}
                        disabled={readOnly}
                        title={readOnly ? "View only" : "Edit"}
                      >
                        <PencilSimple size={18} />
                      </button>
                      <button
                        className={`border rounded-md size-7 flex items-center justify-center ${readOnly ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
                        onClick={() => {
                          if (readOnly) return;
                          startDelete(it.id);
                        }}
                        disabled={readOnly}
                        title={readOnly ? "View only" : "Delete"}
                      >
                        <Trash size={18} />
                      </button>
                    </div>,
                  ],
            className: isEditingItem
              ? "bg-blue-50"
              : isDeletingItem
                ? "bg-red-50"
                : undefined,
          };
        })}
      />
    </div>
  );
}

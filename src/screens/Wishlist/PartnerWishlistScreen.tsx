"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import {
  UpdateWishlistItemBody,
  WishlistItem,
  WishlistPriority,
} from "@/types/api/wishlist.types";
import { mockWishlistItems, priorityOptions } from "@/mock/wishlists";
import ModalTextField from "@/components/ModalTextField";
import ModalDropDown from "@/components/ModalDropDown";
import PriorityTag from "@/components/PriorityTag";
import { Check, PencilSimple, X, ChatTeardropText, Trash } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import CommentModal from "@/components/CommentModal";
import toast from "react-hot-toast";

export default function PartnerWishlistScreen({ partnerId, readOnly = false }: { partnerId?: number; readOnly?: boolean }) {
  const endpoint = useMemo(() => {
    // If partnerId provided (admin viewing a partner), query string is used
    return partnerId ? `/api/wishlists?partnerId=${partnerId}` : "/api/wishlists";
  }, [partnerId]);

  const { data } = useFetch<WishlistItem[]>(endpoint, {
    cache: "no-store",
    onError: () => {},
  });

  /*
   * ================= Planned API (examples) =================
   * (1) Fetch partner wishlist items (already done by useFetch above):
   *     GET /api/wishlists            -> for partner (their own items)
   *     GET /api/wishlists?partnerId=123 -> staff viewing partner 123
   *     Response: WishlistItem[]
   *
   * (2) Create a new wishlist item:
   *     POST /api/wishlists
   *     Body JSON: {
   *       name: string;
   *       unitSize: string;
   *       quantity: number;
   *       priority: "LOW" | "MEDIUM" | "HIGH";
   *       comment?: string;
   *     }
   *     Returns: created WishlistItem (with id, createdAt, updatedAt)
   *
   * (3) Update an existing wishlist item (partial):
   *     PATCH /api/wishlists/:itemId
   *     Body JSON: UpdateWishlistItemBody (any subset of fields)
   *     Returns: updated WishlistItem
   *
   * (4) Delete an item:
   *     DELETE /api/wishlists/:itemId
   *     Returns: { success: true }
   *
   * Example helper (uncomment when backend routes exist):
   *
   *   async function apiCreate(item: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>) {
   *     const res = await fetch('/api/wishlists', {
   *       method: 'POST',
   *       headers: { 'Content-Type': 'application/json' },
   *       body: JSON.stringify(item),
   *     });
   *     if (!res.ok) throw new Error('Failed to create wishlist item');
   *     return res.json() as Promise<WishlistItem>;
   *   }
   *
   *   async function apiPatch(id: number, patch: UpdateWishlistItemBody) {
   *     const res = await fetch(`/api/wishlists/${id}`, {
   *       method: 'PATCH',
   *       headers: { 'Content-Type': 'application/json' },
   *       body: JSON.stringify(patch),
   *     });
   *     if (!res.ok) throw new Error('Failed to update wishlist item');
   *     return res.json() as Promise<WishlistItem>;
   *   }
   *
   *   async function apiDelete(id: number) {
   *     const res = await fetch(`/api/wishlists/${id}`, { method: 'DELETE' });
   *     if (!res.ok) throw new Error('Failed to delete wishlist item');
   *   }
   * ===========================================================
   */

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [editingIds, setEditingIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [, setNewIds] = useState<Set<number>>(new Set());
  const originalsRef = useRef<Map<number, WishlistItem>>(new Map());
  useEffect(() => {
    if (data && Array.isArray(data)) setItems(data);
    else setItems(mockWishlistItems);
  }, [data]);

  // To enable real API persistence later, introduce useApiClient and call PATCH/DELETE where TODO notes are placed below.

  const isEditing = (id: number) => editingIds.has(id);
  const isDeleting = (id: number) => deletingIds.has(id);
  
  const startEdit = (id: number) => {
    if (readOnly) return;
    // Cancel any pending delete confirmation first
    setDeletingIds(prev => {
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
    if (!originalsRef.current.has(id)) {
      const it = items.find(i => i.id === id);
      if (it) originalsRef.current.set(id, { ...it });
    }
  };
  
  const startDelete = (id: number) => {
    if (readOnly) return;
    // Cancel any pending edit first
    cancelEdit(id);
    
    setDeletingIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };
  
  const cancelDelete = (id: number) => {
    setDeletingIds(prev => {
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
      const original = originalsRef.current.get(id);
      if (original) {
        setItems(prev => prev.map(it => (it.id === id ? original : it)));
      }
    }
    // Clear snapshot in all cases once we exit edit
    originalsRef.current.delete(id);
  };

  const applyLocalChange = (id: number, patch: UpdateWishlistItemBody) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? ({ ...it, ...patch } as WishlistItem) : it))
    );
  };

  const isItemComplete = (it: WishlistItem) => {
    const nameOk = typeof it.name === "string" && it.name.trim().length > 0;
    const unitOk = typeof it.unitSize === "string" && it.unitSize.trim().length > 0;
    const qtyOk = Number.isFinite(it.quantity) && it.quantity > 0;
    const prOk = it.priority === "LOW" || it.priority === "MEDIUM" || it.priority === "HIGH";
    // comment is optional
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
  // TODO(API): Replace local update with:
  // const updated = await apiPatch(id, {
  //   name: item.name,
  //   unitSize: item.unitSize,
  //   quantity: item.quantity,
  //   priority: item.priority,
  //   comment: item.comment,
  // });
  // applyLocalChange(id, updated);
  toast.success("Wishlist updated");
      setNewIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      cancelEdit(id, true);
  // Clear snapshot after successful save
  originalsRef.current.delete(id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async (id: number) => {
    if (readOnly) return;
    try {
  // TODO(API): await apiDelete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setDeletingIds(prev => {
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
        title={(items.find(i => i.id === activeCommentId)?.name || "Item") + ": Comment"}
        initialValue={activeCommentId ? (items.find(i => i.id === activeCommentId)?.comment ?? "") : ""}
        onClose={() => {
          // Just close the comment modal; keep the row in edit mode
          setActiveCommentId(null);
        }}
        onSave={(val: string) => {
          if (activeCommentId !== null) {
            applyLocalChange(activeCommentId, { comment: val });
            // keep in edit mode; user can still hit Save row or cancel
          }
          setActiveCommentId(null);
        }}
      />
      <div className="flex items-start justify-between">
        <h1 className="text-xl font-semibold text-gray-primary mb-2">Wish list</h1>
        {!readOnly && (
          <button
            onClick={() => {
              const nextId = Math.max(0, ...items.map(i => i.id)) + 1;
              setItems(prev => [
                ...prev,
                {
                  id: nextId,
                  name: "",
                  unitSize: "",
                  quantity: 0,
                  priority: "LOW",
                  comment: "",
                },
              ]);
              startEdit(nextId);
              setNewIds(prev => {
                const next = new Set(prev);
                next.add(nextId);
                return next;
              });
            }}
            className="inline-flex items-center gap-2 text-sm md:text-base px-4 py-2 bg-red-primary text-white rounded-md shadow-sm hover:brightness-95 active:translate-y-px transition"
          >
            <span aria-hidden className="text-lg leading-none">+</span>
            Add item
          </button>
        )}
      </div>
      <div className="overflow-x-auto mt-2">
  <div className="inline-block min-w-full rounded-t-xl border border-gray-200 shadow-sm">
          <table className="min-w-full">
      <thead className="bg-[rgba(39,116,174,0.80)]">
              <tr>
        <th className="px-4 text-left font-semibold text-white first:rounded-tl-xl">Title</th>
        <th className="px-4 text-left font-semibold text-white">Unit Size</th>
        <th className="px-4 text-left font-semibold text-white">Quantity requested</th>
        <th className="px-4 text-left font-semibold text-white">Priority</th>
        <th className="px-4 text-left font-semibold text-white">Last updated</th>
        <th className="px-4 text-left font-semibold text-white">Comment</th>
        <th className="px-4 text-left font-semibold text-white last:rounded-tr-xl">Manage</th>
              </tr>
            </thead>
            <tbody>
            {items.map((it, idx) => {
              const lastUpdated = new Date().toLocaleDateString(); // placeholder
              return (
                <tr
                  key={it.id}
                  data-odd={idx % 2 !== 0}
                  className={`border-b border-gray-200 transition-colors ${
                    isEditing(it.id) 
                      ? "bg-blue-50" 
                      : isDeleting(it.id)
                      ? "bg-red-50"
                      : "bg-white data-[odd=true]:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-2 w-[18%]">
                    {isEditing(it.id) && !isDeleting(it.id) ? (
                      <ModalTextField
                        name="name"
                        placeholder="Title"
                        inputProps={{
                          defaultValue: it.name,
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                            applyLocalChange(it.id, { name: e.target.value }),
                        }}
                      />
                    ) : (
                      <span>
                        {it.name || <span className="text-gray-400 italic">(untitled)</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 w-[12%]">
                    {isEditing(it.id) && !isDeleting(it.id) ? (
                      <ModalTextField
                        name="unitSize"
                        placeholder="Unit Size"
                        inputProps={{
                          defaultValue: it.unitSize,
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                            applyLocalChange(it.id, { unitSize: e.target.value }),
                        }}
                      />
                    ) : (
                      <span>
                        {it.unitSize || <span className="text-gray-400 italic">(unit size)</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 w-[10%]">
                    {isEditing(it.id) && !isDeleting(it.id) ? (
                      <ModalTextField
                        name="quantity"
                        type="number"
                        placeholder="Qty"
                        inputProps={{
                          defaultValue: it.quantity,
                          min: 0,
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                            applyLocalChange(it.id, { quantity: Number(e.target.value) }),
                        }}
                      />
                    ) : (
                      <span>
                        {it.quantity}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 w-[12%]">
                    {isEditing(it.id) && !isDeleting(it.id) ? (
                      <ModalDropDown
                        key={`priority-${it.id}-${it.priority}`}
                        name="priority"
                        placeholder="Priority"
                        options={priorityOptions}
                        required
                        defaultSelected={{
                          label: it.priority.charAt(0) + it.priority.slice(1).toLowerCase(),
                          value: it.priority,
                        }}
                        renderOption={(opt) => <PriorityTag priority={opt.value} />}
                        renderValue={(opt) => <PriorityTag priority={opt.value} />}
                        onSelect={(value: string) =>
                          applyLocalChange(it.id, { priority: value as WishlistPriority })
                        }
                      />
                    ) : (
                      <span>
                        <PriorityTag priority={it.priority} />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 w-[12%]">{lastUpdated}</td>
                  <td className="px-4 py-2 w-[16%]">
                    {/* View: tooltip. Edit: open modal */}
                    {!isEditing(it.id) || isDeleting(it.id) ? (
                      <>
                        <ChatTeardropText
                          data-tooltip-id={`wishlist-comment-${it.id}`}
                          data-tooltip-content={it.comment || ""}
                          size={22}
                          className={`${it.comment ? "text-black" : "text-gray-300"}`}
                        />
                        {it.comment && (
                          <Tooltip key={`wishlist-comment-${it.id}-${it.comment}`} id={`wishlist-comment-${it.id}`} className="max-w-64 whitespace-pre-wrap" />
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveCommentId(it.id)}
                        className="rounded-full size-8 flex items-center justify-center border transition-colors hover:bg-gray-100"
                        title="Edit comment"
                      >
                        <ChatTeardropText size={22} className="text-blue-500" />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2 w-[20%]">
                    {isEditing(it.id) && !readOnly ? (
                      <div className="flex gap-2">
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
                          title={isItemComplete(it) ? "Save" : "Fill required fields to save"}
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    ) : isDeleting(it.id) && !readOnly ? (
                      <div className="flex gap-2">
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
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          className={`border rounded-md size-7 flex items-center justify-center ${readOnly ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
                          onClick={() => {
                            if (readOnly) return; // inert in read-only mode
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
                            if (readOnly) return; // inert in read-only mode
                            startDelete(it.id);
                          }}
                          disabled={readOnly}
                          title={readOnly ? "View only" : "Delete"}
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

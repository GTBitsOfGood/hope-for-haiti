"use client";

import { useEffect, useMemo, useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import {
  UpdateWishlistItemBody,
  WishlistItem,
  WishlistPriority,
} from "@/types/api/wishlist.types";
import { mockWishlistItems, priorityOptions } from "@/mock/wishlists";
import ModalTextField from "@/components/ModalTextField";
import ModalDropDown from "@/components/ModalDropDown";
import { Check, PencilSimple, X, ChatTeardropText, Trash } from "@phosphor-icons/react";
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

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [editingIds, setEditingIds] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (data && Array.isArray(data)) setItems(data);
    else setItems(mockWishlistItems);
  }, [data]);

  // To enable real API persistence later, introduce useApiClient and call PATCH/DELETE where TODO notes are placed below.

  const isEditing = (id: number) => editingIds.has(id);
  const startEdit = (id: number) => {
    if (readOnly) return;
    setEditingIds((prev) => new Set(prev).add(id));
  };
  const cancelEdit = (id: number) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const applyLocalChange = (id: number, patch: UpdateWishlistItemBody) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? ({ ...it, ...patch } as WishlistItem) : it))
    );
  };

  const save = async (id: number) => {
    if (readOnly) return;
    const item = items.find((i) => i.id === id);
    if (!item) return;
    try {
      // TODO(API): PATCH /api/wishlists/${partnerId ?? 'me'} with item fields.
      toast.success("Wishlist updated");
      cancelEdit(id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async (id: number) => {
    if (readOnly) return;
    try {
      // TODO(API): DELETE /api/wishlists/${partnerId ?? 'me'} with { id }.
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Wishlist item removed");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="pb-32">
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
            }}
            className="text-sm px-4 py-1 border border-red-primary text-red-primary rounded-md hover:bg-red-primary hover:text-white transition-colors"
          >
            Add
          </button>
        )}
      </div>
      <div className="overflow-x-auto mt-2">
        <table className="min-w-full rounded-t-lg">
          <thead>
            <tr className="bg-blue-primary text-white">
              <th className="px-4 py-2 text-left font-medium">Title</th>
              <th className="px-4 py-2 text-left font-medium">Unit Size</th>
              <th className="px-4 py-2 text-left font-medium">Quantity requested</th>
              <th className="px-4 py-2 text-left font-medium">Priority</th>
              <th className="px-4 py-2 text-left font-medium">Last updated</th>
              <th className="px-4 py-2 text-left font-medium">Comment</th>
              <th className="px-4 py-2 text-left font-medium">Manage</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              const lastUpdated = new Date().toLocaleDateString(); // placeholder
              const priorityClass =
                it.priority === "HIGH"
                  ? "bg-red-200 text-red-800"
                  : it.priority === "MEDIUM"
                  ? "bg-orange-200 text-orange-800"
                  : "bg-green-200 text-green-800";
              return (
                <tr
                  key={it.id}
                  data-odd={idx % 2 !== 0}
                  className="bg-white data-[odd=true]:bg-gray-50 border-b"
                >
                  <td className="px-4 py-2 w-[18%]">
                    {isEditing(it.id) ? (
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
                      it.name || <span className="text-gray-400 italic">(untitled)</span>
                    )}
                  </td>
                  <td className="px-4 py-2 w-[12%]">
                    {isEditing(it.id) ? (
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
                      it.unitSize
                    )}
                  </td>
                  <td className="px-4 py-2 w-[10%]">
                    {isEditing(it.id) ? (
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
                      it.quantity
                    )}
                  </td>
                  <td className="px-4 py-2 w-[12%]">
                    {isEditing(it.id) ? (
                      <ModalDropDown
                        name="priority"
                        placeholder="Priority"
                        options={priorityOptions}
                        required
                        defaultSelected={{
                          label: it.priority.charAt(0) + it.priority.slice(1).toLowerCase(),
                          value: it.priority,
                        }}
                        onSelect={(value: string) =>
                          applyLocalChange(it.id, { priority: value as WishlistPriority })
                        }
                      />
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${priorityClass}`}>
                        {it.priority === "MEDIUM" ? "Med" : it.priority.charAt(0) + it.priority.slice(1).toLowerCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 w-[12%]">{lastUpdated}</td>
                  <td className="px-4 py-2 w-[16%]">
                    {isEditing(it.id) ? (
                      <ModalTextField
                        name="comment"
                        placeholder="Comment"
                        inputProps={{
                          defaultValue: it.comment ?? "",
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                            applyLocalChange(it.id, { comment: e.target.value }),
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        disabled={!it.comment}
                        onClick={() => setActiveCommentId(it.id === activeCommentId ? null : it.id)}
                        className={`rounded-full size-8 flex items-center justify-center border transition-colors ${
                          it.comment
                            ? "border-gray-300 hover:bg-gray-100"
                            : "border-transparent text-gray-300 cursor-default"
                        }`}
                        title={it.comment ? "View comment" : "No comment"}
                      >
                        <ChatTeardropText size={22} />
                      </button>
                    )}
                    {activeCommentId === it.id && it.comment && !isEditing(it.id) && (
                      <div className="mt-2 p-2 border rounded bg-white shadow text-sm max-w-xs">{it.comment}</div>
                    )}
                  </td>
                  <td className="px-4 py-2 w-[20%]">
                    {readOnly ? null : (
                      isEditing(it.id) ? (
                        <div className="flex gap-2">
                          <button
                            className="border border-red-primary rounded-md size-7 flex items-center justify-center"
                            onClick={() => cancelEdit(it.id)}
                            title="Cancel"
                          >
                            <X className="text-red-primary" size={18} />
                          </button>
                          <button
                            className="bg-blue-primary rounded-md size-7 flex items-center justify-center text-white"
                            onClick={() => save(it.id)}
                            title="Save"
                          >
                            <Check size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            className="border rounded-md size-7 flex items-center justify-center"
                            onClick={() => startEdit(it.id)}
                            title="Edit"
                          >
                            <PencilSimple size={18} />
                          </button>
                          <button
                            className="border rounded-md size-7 flex items-center justify-center"
                            onClick={() => remove(it.id)}
                            title="Delete"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

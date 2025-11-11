"use client";

import { useEffect, useState } from "react";
import { X } from "@phosphor-icons/react";
import ModalFormRow from "@/components/ModalFormRow";
import ModalTextField from "@/components/ModalTextField";
import ModalLongTextField from "@/components/ModalLongTextField";
import { $Enums } from "@prisma/client";
import { titleCase } from "@/util/util";
import ModalDropDown from "./ModalDropDown";

export type WishlistEditable = {
  id: number;
  name: string; // Title (read-only)
  quantity?: number | null;
  priority?: $Enums.RequestPriority;
  comments?: string | null;
};

interface EditWishlistModalProps {
  isOpen: boolean;
  item: WishlistEditable | null;
  onClose: () => void;
  onSave: (updates: {
    id: number;
    quantity?: number;
    priority: $Enums.RequestPriority;
    comments?: string;
  }) => Promise<void>;
}

export default function EditWishlistModal({
  isOpen,
  item,
  onClose,
  onSave,
}: EditWishlistModalProps) {
  const [quantity, setQuantity] = useState<string>("");
  const [priority, setPriority] = useState<$Enums.RequestPriority>();
  const [comments, setComments] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;
    setQuantity(item.quantity?.toString() ?? "");
    setComments(item.comments ?? "");
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSave({
        id: item.id,
        quantity: quantity === "" ? undefined : Number(quantity),
        priority: priority || $Enums.RequestPriority.LOW,
        comments: comments.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-[720px] rounded-2xl bg-white p-6 md:p-8 shadow-xl">
          <div className="flex items-start justify-between mb-6 md:mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Edit Wishlist Item
            </h2>
            <button
              type="button"
              aria-label="Close"
              className="p-1 rounded hover:bg-gray-100 active:scale-95"
              onClick={onClose}
            >
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <ModalTextField
              label="Title"
              name="name"
              required
              defaultValue={item.name}
              className="bg-gray-100 cursor-not-allowed"
              inputProps={{ readOnly: true }}
            />
            <ModalFormRow>
              {/* Quantity + Priority */}
              <ModalTextField
                label="Quantity Requested"
                name="quantity"
                type="number"
                placeholder="Enter quantity"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <ModalDropDown
                label="Priority"
                name="priority"
                placeholder="Select priority"
                required
                className="w-1/4"
                options={Object.values($Enums.RequestPriority).map((p) => ({
                  label: titleCase(p),
                  value: p,
                }))}
                onSelect={(priority) =>
                  setPriority(priority as $Enums.RequestPriority)
                }
                defaultSelected={
                  priority
                    ? { label: titleCase(priority), value: priority }
                    : undefined
                }
              />
            </ModalFormRow>

            {/* Comments (controlled) */}
            <ModalFormRow>
              <ModalLongTextField
                label="Comments"
                name="comments"
                placeholder="Add a comment"
                value={comments}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setComments(e.target.value)
                }
              />
            </ModalFormRow>

            <div className="mt-6 flex gap-4">
              <button
                type="button"
                className="w-1/2 rounded-lg border border-red-primary px-4 py-2 font-medium text-red-primary hover:bg-red-50 active:translate-y-px"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-1/2 rounded-lg px-4 py-2 font-medium text-white active:translate-y-px bg-red-primary hover:brightness-95 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import { X } from "@phosphor-icons/react";

interface DeleteWishlistModalProps {
  isOpen: boolean;
  itemName?: string; // for display
  onClose: () => void;
  onConfirm: () => Promise<void>; // perform deletion
}

export default function DeleteWishlistModal({
  isOpen,
  itemName,
  onClose,
  onConfirm,
}: DeleteWishlistModalProps) {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-[560px] rounded-2xl bg-white p-6 md:p-8 shadow-xl">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Delete Wishlist Item
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

          <p className="text-gray-700 mb-6">
            Are you sure you want to delete
            {itemName ? (
              <>
                {" "}
                <span className="font-semibold">“{itemName}”</span>
              </>
            ) : (
              " this item"
            )}
            ? This action cannot be undone.
          </p>

          <div className="flex gap-4">
            <button
              type="button"
              className="w-1/2 rounded-lg border border-red-primary px-4 py-2 font-medium text-red-primary hover:bg-red-50 active:translate-y-px"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="w-1/2 rounded-lg px-4 py-2 font-medium text-white active:translate-y-px bg-red-primary hover:brightness-95"
              onClick={async () => {
                await onConfirm();
                onClose();
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

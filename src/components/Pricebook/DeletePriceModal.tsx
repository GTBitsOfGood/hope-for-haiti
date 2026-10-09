import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState } from "react";
import type { ItemPriceResponse } from "@/types/api/itemPrice.types";

export default function DeletePriceModal({ item, onClose, onDelete }: {
  item: ItemPriceResponse | null;
  onClose: () => void;
  onDelete: (item: ItemPriceResponse) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!item) return null;

  const close = () => {
    if (!pending) {
      setError("");
      onClose();
    }
  };
  const remove = async () => {
    setPending(true);
    setError("");
    try {
      await onDelete(item);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete price.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open onClose={close} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
          <DialogTitle className="text-xl font-semibold text-gray-900">Delete price?</DialogTitle>
          <p className="mt-3 text-gray-700">Permanently delete the price for <strong>{item.ndc}</strong>?</p>
          {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={close} disabled={pending} className="rounded-md border border-red-primary bg-white px-8 py-1.5 text-red-primary transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50">Cancel</button>
            <button type="button" onClick={remove} disabled={pending} className="rounded-md border border-red-primary bg-red-500 px-3 py-1.5 text-white transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50">{pending ? "Deleting…" : "Delete permanently"}</button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

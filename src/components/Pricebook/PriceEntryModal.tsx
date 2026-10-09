import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useEffect, useState } from "react";
import type { ItemPriceInput, ItemPriceResponse } from "@/types/api/itemPrice.types";
import { isValidMoneyString } from "@/util/itemPrice";

export default function PriceEntryModal({ item, onClose, onSave }: {
  item: ItemPriceResponse | null | "new";
  onClose: () => void;
  onSave: (value: ItemPriceInput, item: ItemPriceResponse | null) => Promise<void>;
}) {
  const editing = item !== "new";
  const selected = item === "new" ? null : item;
  const isOpen = item !== null;
  const [ndc, setNdc] = useState(selected?.ndc ?? "");
  const [price, setPrice] = useState(selected?.unitPrice ?? "");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setNdc(selected?.ndc ?? "");
    setPrice(selected?.unitPrice ?? "");
    setError("");
  }, [isOpen, selected?.id, selected?.ndc, selected?.unitPrice]);

  if (item === null) return null;
  const close = () => { if (!pending) onClose(); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{5}-\d{4}-\d{2}$/.test(ndc)) {
      setError("Enter an NDC in 5-4-2 format, for example 00093-4155-73.");
      return;
    }
    if (!isValidMoneyString(price)) {
      setError("Enter a non-negative price without leading zeros, with up to two decimal places and within the supported money range.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await onSave({ ndc, unitPrice: price }, selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save price.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open onClose={close} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {editing ? "Edit price" : "Add price"}
          </DialogTitle>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <p className="text-sm text-gray-600">
              Saving confirms this price as current, updates its timestamp, and records you as the latest saver.
            </p>
            <div>
              <label htmlFor="price-ndc" className="mb-1 block text-sm font-medium text-gray-700">NDC</label>
              <input
                id="price-ndc"
                required
                autoFocus
                value={ndc}
                onChange={e => setNdc(e.target.value)}
                placeholder="00093-4155-73"
                aria-describedby="ndc-guidance"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p id="ndc-guidance" className="mt-1 text-sm text-gray-600">Use canonical 5-4-2 format, for example 00093-4155-73.</p>
            </div>
            <div>
              <label htmlFor="price-unit" className="mb-1 block text-sm font-medium text-gray-700">Unit price</label>
              <div className="flex items-center rounded-lg border border-gray-300 bg-gray-50 px-3 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500">
                <span aria-hidden="true" className="text-gray-700">$</span>
                <input
                  id="price-unit"
                  required
                  inputMode="decimal"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="0.00"
                  aria-describedby="price-guidance"
                  className="w-full border-0 bg-transparent px-2 py-2 text-gray-900 outline-none focus:ring-0"
                />
              </div>
              <p id="price-guidance" className="mt-1 text-sm text-gray-600">Non-negative amount, up to two decimal places. Zero is allowed.</p>
            </div>
            {error && <p role="alert" aria-live="assertive" className="text-red-700">{error}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={close} disabled={pending} className="rounded-md border border-red-primary bg-white px-8 py-1.5 text-red-primary transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={pending} className="rounded-md border border-red-primary bg-red-500 px-3 py-1.5 text-white transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50">{pending ? "Saving…" : "Save price"}</button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

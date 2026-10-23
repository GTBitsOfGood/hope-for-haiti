import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState } from "react";
import type { PriceCheckedItem } from "@/types/api/donorOffer.types";
import { useApiClient } from "@/hooks/useApiClient";
import { isValidMoneyString } from "@/util/itemPrice";

interface PriceCheckStepperModalProps {
  /** Only the blocking (missing/expired) rows, in the order to step through. */
  items: PriceCheckedItem[];
  onClose: () => void;
  /** Called once, whenever the form closes — stepping past the last row, or
   * backing out early — so the caller can re-run Preview for fresh statuses. */
  onSaved: () => void;
}

export default function PriceCheckStepperModal({
  items,
  onClose,
  onSaved,
}: PriceCheckStepperModalProps) {
  const { apiClient } = useApiClient();
  const [index, setIndex] = useState(0);
  const current = items[index];
  const [price, setPrice] = useState(current.priceCheck.price ?? "");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const advance = () => {
    if (index + 1 >= items.length) {
      onSaved();
      onClose();
      return;
    }
    const next = items[index + 1];
    setIndex(index + 1);
    setPrice(next.priceCheck.price ?? "");
    setError("");
  };

  // Any close path — finishing the list, or backing out early via Escape/
  // backdrop click — re-runs Preview, per the issue: "When the form closes,
  // run Preview again to get fresh statuses." Cheap no-op if nothing changed.
  const close = () => {
    if (pending) return;
    onSaved();
    onClose();
  };

  const save = async () => {
    if (current.priceCheck.codeType === "UPC") {
      setError("UPC codes aren't supported in the pricebook yet — ask the team to add this price by NDC instead.");
      return;
    }
    if (!isValidMoneyString(price)) {
      setError(
        "Enter a non-negative price without leading zeros, with up to two decimal places and within the supported money range."
      );
      return;
    }
    if (Number(price) === 0) {
      setError("A $0 price isn't allowed here — it would still count as missing.");
      return;
    }
    if (!current.priceCheck.code) {
      setError("This row has no usable code to save a price against.");
      return;
    }

    setPending(true);
    setError("");
    try {
      const body = JSON.stringify({ ndc: current.priceCheck.code, unitPrice: price });
      if (current.priceCheck.status === "expired" && current.priceCheck.itemPriceId) {
        await apiClient.patch(`/api/itemPrices/${current.priceCheck.itemPriceId}`, { body });
      } else {
        await apiClient.post("/api/itemPrices", { body });
      }
      advance();
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
        <DialogPanel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Add prices — {index + 1} of {items.length}
          </DialogTitle>
          <div className="mt-4 space-y-1">
            <p className="text-sm text-gray-600">Item</p>
            <p className="font-medium text-gray-900">{current.title}</p>
            <p className="mt-2 text-sm text-gray-600">Code</p>
            <p className="font-medium text-gray-900">{current.priceCheck.code ?? "—"}</p>
          </div>
          <div className="mt-4">
            <label
              htmlFor="price-check-stepper-price"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Our price
            </label>
            <div className="flex items-center rounded-lg border border-gray-300 bg-gray-50 px-3 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500">
              <span aria-hidden="true" className="text-gray-700">
                $
              </span>
              <input
                id="price-check-stepper-price"
                autoFocus
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full border-0 bg-transparent px-2 py-2 text-gray-900 outline-none focus:ring-0"
              />
            </div>
          </div>
          {error && (
            <p role="alert" aria-live="assertive" className="mt-2 text-red-700">
              {error}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={advance}
              disabled={pending}
              className="rounded-md border border-gray-300 bg-white px-4 py-1.5 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="rounded-md border border-red-primary bg-red-500 px-3 py-1.5 text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save and next"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

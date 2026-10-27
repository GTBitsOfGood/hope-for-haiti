"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X } from "@phosphor-icons/react";
import { useState } from "react";
import type {
  ItemPriceUploadLine,
  ItemPriceUploadReview,
} from "@/types/api/itemPrice.types";

type GroupKey = keyof ItemPriceUploadReview["groups"];

const GROUP_LABELS: Record<GroupKey, string> = {
  new: "New",
  changed: "Changed",
  same: "Same",
  problems: "Problems",
};

function formatMoney(value: string | null) {
  if (value === null) return "";
  const [whole, fraction = ""] = value.split(".");
  return `$${whole}${fraction ? `.${fraction.padEnd(2, "0")}` : ".00"}`;
}

function detail(line: ItemPriceUploadLine) {
  if (line.status === "problem") return line.reasons.join(" ");
  if (line.status === "same") return "No change. Saving refreshes the date.";
  if (line.status === "new") return "New price.";
  const changes: string[] = [];
  if (line.old && line.old.unitPrice !== line.price) {
    changes.push(
      `Price ${formatMoney(line.old.unitPrice)} to ${formatMoney(line.price)}`
    );
  }
  if (line.old && (line.old.name ?? null) !== (line.name ?? null)) {
    changes.push(
      `Name ${line.old.name ?? "(blank)"} to ${line.name ?? "(blank)"}`
    );
  }
  return changes.join("; ");
}

export default function PriceUploadModal({
  review,
  fileName,
  onClose,
  onSave,
}: {
  review: ItemPriceUploadReview;
  fileName: string;
  onClose: () => void;
  onSave: (selected: number[]) => Promise<void>;
}) {
  const actionable = [
    ...review.groups.new,
    ...review.groups.changed,
    ...review.groups.same,
  ];
  const [selected, setSelected] = useState(
    () => new Set(actionable.map((line) => line.lineNumber))
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    if (!pending) onClose();
  };

  const toggle = (lineNumber: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(lineNumber)) next.delete(lineNumber);
      else next.add(lineNumber);
      return next;
    });
  };

  const toggleGroup = (lines: ItemPriceUploadLine[]) => {
    setSelected((current) => {
      const next = new Set(current);
      const allSelected = lines.every((line) => next.has(line.lineNumber));
      for (const line of lines) {
        if (allSelected) next.delete(line.lineNumber);
        else next.add(line.lineNumber);
      }
      return next;
    });
  };

  const save = async () => {
    if (selected.size === 0 || pending) return;
    setPending(true);
    setError("");
    try {
      await onSave(Array.from(selected));
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save prices."
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open onClose={close} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-200 p-6">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Review price upload
              </DialogTitle>
              <p className="mt-1 text-sm text-gray-600">
                {fileName}. New, changed, and same lines are selected by default.
                Problem lines are never saved.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-blue-light px-3 py-1 font-medium text-gray-primary">
                  {review.counts.new} new
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-900">
                  {review.counts.changed} changed
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
                  {review.counts.same} same
                </span>
                <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-800">
                  {review.counts.problems} problems
                </span>
                {review.counts.skipped > 0 && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
                    {review.counts.skipped} skipped
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              disabled={pending}
              aria-label="Close upload review"
              className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>

            <div className="p-6">
            {review.counts.skipped > 0 && (
              <p className="mb-4 text-sm text-gray-600">
                Lines with a blank price were skipped, as intended.
              </p>
            )}
            {(Object.keys(GROUP_LABELS) as GroupKey[]).map((key) => {
              const lines = review.groups[key];
              if (lines.length === 0) return null;
              const selectable = key !== "problems";
              const allSelected =
                selectable &&
                lines.every((line) => selected.has(line.lineNumber));
              return (
                <section key={key} className="mb-6 last:mb-0">
                  <div className="mb-2 flex items-center gap-3">
                    {selectable && (
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => toggleGroup(lines)}
                        aria-label={`Select all ${GROUP_LABELS[key]} lines`}
                        className="h-4 w-4 accent-red-600"
                      />
                    )}
                    <h3 className="font-semibold text-gray-900">
                      {GROUP_LABELS[key]} ({lines.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full min-w-[760px] text-left text-sm text-gray-primary">
                      <thead className="border-b-2 border-blue-primary/10 bg-blue-light text-gray-primary/70">
                        <tr>
                          {selectable && (
                            <th className="w-10 px-3 py-2">
                              <span className="sr-only">Select</span>
                            </th>
                          )}
                          <th className="px-3 py-2">Line</th>
                          <th className="px-3 py-2">Code</th>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Price</th>
                          <th className="px-3 py-2">
                            {key === "problems" ? "Reason" : "Change"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((line) => (
                          <tr
                            key={line.lineNumber}
                            className="border-b border-blue-primary/10 align-top odd:bg-blue-light/35"
                          >
                            {selectable && (
                              <td className="px-3 py-3">
                                <input
                                  type="checkbox"
                                  checked={selected.has(line.lineNumber)}
                                  onChange={() => toggle(line.lineNumber)}
                                  aria-label={`Select line ${line.lineNumber}`}
                                  className="h-4 w-4 accent-red-600"
                                />
                              </td>
                            )}
                            <td className="px-3 py-3 text-gray-primary/60">
                              {line.lineNumber}
                            </td>
                            <td className="px-3 py-3 font-medium text-gray-primary">
                              {line.code ?? line.rawCode ?? ""}
                            </td>
                            <td className="px-3 py-3 text-gray-primary">
                              {line.name ?? ""}
                            </td>
                            <td className="px-3 py-3 text-gray-primary">
                              {line.price
                                ? formatMoney(line.price)
                                : line.rawPrice}
                            </td>
                            <td
                              className={
                                key === "problems"
                                  ? "px-3 py-3 text-red-700"
                                  : "px-3 py-3 text-gray-primary/70"
                              }
                            >
                              {detail(line)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
            {review.totalRows === 0 && (
              <p className="text-sm text-gray-600">
                This file has no price rows to review.
              </p>
            )}
            </div>
          </div>

          <div className="shrink-0 border-t border-gray-200 p-4 sm:px-6">
            {error && (
              <p role="alert" className="mb-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="rounded-md border border-red-primary bg-white px-8 py-1.5 text-red-primary transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending || selected.size === 0}
                className="rounded-md border border-red-primary bg-red-500 px-3 py-1.5 text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {pending
                  ? "Saving..."
                  : `Save ${selected.size} price${
                      selected.size === 1 ? "" : "s"
                    }`}
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "@phosphor-icons/react";
import ModalFormRow from "@/components/ModalFormRow";
import ModalTextField from "@/components/ModalTextField";
import ModalLongTextField from "@/components/ModalLongTextField";
import { useApiClient } from "@/hooks/useApiClient";
import AdvancedBaseTable, {
  ColumnDefinition,
  TableQuery,
} from "./baseTable/AdvancedBaseTable";
import Link from "next/link";
import { Wishlist } from "@prisma/client";

type Suggestion = {
  id: number;
  title: string;
  donorOfferId: number | null;
  similarity: number; // 0..1
  strength: "soft" | "hard";
  quantity: number;
  unitSize: string;
};

export type AddToWishlistForm = {
  name: string; // Title
  quantity?: number; // Step 2
  comments?: string; // Step 2
};

interface AddToWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Wishlist) => void;
}

export default function AddToWishlistModal({
  isOpen,
  onClose,
  onSave,
}: AddToWishlistModalProps) {
  const { apiClient } = useApiClient();

  // NEW: wizard step (1 = title/suggestions, 2 = details)
  const [step, setStep] = useState<1 | 2>(1);

  const [form, setForm] = useState<AddToWishlistForm>({
    name: "",
  });

  // --- Suggestions state ---
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [hardMatch, setHardMatch] = useState<boolean>(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestionColumns: ColumnDefinition<Suggestion>[] = [
    {
      id: "title",
      header: "Title",
      cell: (s) => s.title,
      filterType: "string",
    },
    {
      id: "unitSize",
      header: "Unit Size",
      cell: (s) => s.unitSize ?? "-",
      filterType: "string",
    },
    {
      id: "quantity",
      header: "Quantity",
      cell: (s) => s.quantity ?? "-",
      filterType: "number",
    },
  ];

  // ---- Debounced compare lookup (only on Step 1) ----
  useEffect(() => {
    if (!isOpen || step !== 1) return;

    const q = form.name.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSearching(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const url = `/api/generalItems/compare?${new URLSearchParams({ title: q }).toString()}`;
        // Expected response: { results: Suggestion[] }
        const resp = await apiClient.get<{ results?: Suggestion[] }>(url);
        const hits = resp?.results ?? [];
        setSuggestions(hits);
        setHardMatch(hits.some((h) => h.strength === "hard"));
      } catch {
        setSuggestions([]);
      }
      setSearching(false);
    }, 500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [form.name, apiClient, isOpen, step]);

  // Reset to step 1 when reopened
  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // STEP 1 → STEP 2
  const goToStep2 = () => {
    if (!form.name.trim() || hardMatch) return;
    setStep(2);
  };

  // Final submit at STEP 2
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      quantity: form.quantity, // number | undefined
      comments: form.comments?.trim() || undefined,
      unitSize: "N/A",
      priority: "LOW",
    };

    // TODO: POST to /api/wishlists with `payload`
    console.log("Submitting wish:", payload);
    await apiClient.post("/api/wishlists", {
      body: JSON.stringify(payload),
    });
    onSave(payload as Wishlist); // Cast for onSave callback
  };

  const suggestionFetchFn = async (
    pageSize: number,
    page: number
  ): Promise<TableQuery<Suggestion>> => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return { data: suggestions.slice(start, end), total: suggestions.length };
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      {/* Inset dim background */}
      <div className="fixed inset-0 bg-black/40" />

      {/* Centered card */}
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-[720px] rounded-2xl bg-white p-6 md:p-8 shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 md:mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              {step === 1 ? "Add to Wishlist" : "Add to Wishlist – Details"}
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

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
              <>
                <ModalFormRow>
                  <ModalTextField
                    label="Title"
                    name="name"
                    placeholder="Placeholder name"
                    required
                    defaultValue={form.name}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, name: e.target.value }));
                      setSuggestions([]);
                    }}
                  />
                </ModalFormRow>

                {/* Suggestions block (red highlighted) */}
                {!searching && suggestions.length > 0 && (
                  <>
                    <div className="rounded-lg border border-red-primary bg-red-50/50 p-3 md:p-4">
                      <div className="mb-3">
                        {hardMatch ? (
                          <h3 className="text-red-primary font-semibold text-lg">
                            This item already exists in our inventory. <br />{" "}
                            Please request that item instead.
                          </h3>
                        ) : (
                          <h3 className="text-red-primary font-semibold text-lg">
                            Similar items are in our inventory. <br /> Please go
                            to Items Page if any of these match.
                          </h3>
                        )}
                      </div>

                      <AdvancedBaseTable<Suggestion>
                        columns={suggestionColumns}
                        fetchFn={suggestionFetchFn}
                        rowId="id"
                        headerClassName="bg-red-primary/80 text-white"
                        rowCellStyles="border border-transparent bg-white"
                        emptyState={
                          <div className="py-3 text-sm text-red-700">
                            No similar items found.
                          </div>
                        }
                        toolBar={null}
                        disablePagination
                        disableFilters
                      />
                    </div>

                    <div className="mt-6 flex gap-4">
                      <Link
                        href="/items"
                        className="inline-block w-1/2 rounded-lg border border-red-primary px-4 py-2 font-medium text-red-primary hover:bg-red-50 active:translate-y-px text-center"
                      >
                        Go to Items Page
                      </Link>

                      {/* Continue → Step 2 */}
                      <button
                        type="button"
                        onClick={goToStep2}
                        disabled={hardMatch || !form.name.trim()}
                        className={`w-1/2 rounded-lg px-4 py-2 font-medium text-white active:translate-y-px ${
                          hardMatch || !form.name.trim()
                            ? "bg-red-300 cursor-not-allowed"
                            : "bg-red-primary hover:brightness-95"
                        }`}
                      >
                        Continue with Wish
                      </button>
                    </div>
                  </>
                )}

                {/* No suggestions but non-empty title */}
                {!searching && suggestions.length === 0 && form.name !== "" && (
                  <button
                    type="button"
                    onClick={goToStep2}
                    className="w-full rounded-lg px-4 py-2 font-medium text-white active:translate-y-px bg-red-primary hover:brightness-95"
                  >
                    Continue with Wish
                  </button>
                )}
              </>
            )}

            {step === 2 && (
              <>
                {/* Title (read-only) + Quantity (same row) */}
                <ModalFormRow>
                  <ModalTextField
                    label="Title"
                    name="name"
                    required
                    defaultValue={form.name}
                    className="bg-gray-100 cursor-not-allowed"
                    inputProps={{ readOnly: true }}
                  />
                  <ModalTextField
                    label="Quantity Requested"
                    name="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    required
                    value={form.quantity?.toString() ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        quantity:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      }))
                    }
                  />
                </ModalFormRow>

                {/* Comments */}
                <ModalFormRow>
                  <ModalLongTextField
                    label="Comments"
                    name="comments"
                    placeholder="Comment about an item that can go here."
                    value={form.comments ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setForm((f) => ({ ...f, comments: e.target.value }))
                    }
                  />
                </ModalFormRow>

                {/* Actions */}
                <div className="mt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/2 rounded-lg border border-red-primary px-4 py-2 font-medium text-red-primary hover:bg-red-50 active:translate-y-px"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 rounded-lg px-4 py-2 font-medium text-white active:translate-y-px bg-red-primary hover:brightness-95"
                  >
                    Add to Wishlist
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

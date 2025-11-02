// src/components/wishlist/AddToWishlistModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "@phosphor-icons/react";
import ModalFormRow from "@/components/ModalFormRow";
import ModalTextField from "@/components/ModalTextField";
import { useApiClient } from "@/hooks/useApiClient";
import AdvancedBaseTable, {
  ColumnDefinition,
  TableQuery,
} from "./baseTable/AdvancedBaseTable";
import Link from "next/link";

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
  name: string;
};

interface AddToWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddToWishlistModal({
  isOpen,
  onClose,
}: AddToWishlistModalProps) {
  const { apiClient } = useApiClient();

  const [form, setForm] = useState<AddToWishlistForm>({
    name: "",
  });

  // --- Suggestions state ---
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(true);
  const [hardMatch, setHardMatch] = useState<boolean>(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Reset suggestion UI when opening
    setShowSuggestions(true);
    // sync defaults
  }, [isOpen]);

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

  // ---- Debounced compare lookup ----
  useEffect(() => {
    if (!isOpen) return;

    // Only search if we have something non-trivial
    const q = form.name.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        const url = `/api/generalItems/compare?${new URLSearchParams({
          title: q,
        }).toString()}`;
        // Expected response: { results: Suggestion[] }
        const resp = await apiClient.get<{ results?: Suggestion[] }>(url);
        const hits = resp?.results ?? [];

        // If there are results and we haven't dismissed, show them
        setSuggestions(hits);
        if (hits.length > 0) {
          const hasHard = hits.some((h) => h.strength === "hard");
          setHardMatch(hasHard);
          setShowSuggestions(true);
        } else if (hits.length === 0) {
          setShowSuggestions(false);
        }
      } catch {
        // On error, just hide the suggestions (don’t block form)
        setSuggestions([]);
      }
    }, 500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [form.name, apiClient, isOpen, showSuggestions]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting wish:", form);
  };

  const suggestionFetchFn = async (
    pageSize: number,
    page: number
  ): Promise<TableQuery<Suggestion>> => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      data: suggestions.slice(start, end),
      total: suggestions.length,
    };
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
              Add to Wishlist
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <ModalFormRow>
              <ModalTextField
                label="Title"
                name="name"
                placeholder="Placeholder name"
                required
                defaultValue={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }));
                  setShowSuggestions(false);
                  setSuggestions([]);
                }}
              />
            </ModalFormRow>

            {/* Suggestions block (red highlighted) */}
            {showSuggestions && suggestions.length > 0 && (
              <>
                <div className="rounded-lg border border-red-primary bg-red-50/50 p-3 md:p-4">
                  <div className="mb-3">
                    {hardMatch ? (
                      <h3 className="text-red-primary font-semibold text-lg">
                        This item already exists in our inventory. <br /> Please
                        request that item instead.
                      </h3>
                    ) : (
                      <h3 className="text-red-primary font-semibold text-lg">
                        Similar items are in our inventory. <br /> Please go to
                        Items Page if any of these match.
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
                  <button
                    type="submit"
                    disabled={hardMatch}
                    className={`cursor-pointer w-1/2 rounded-lg px-4 py-2 font-medium text-white active:translate-y-px ${
                      hardMatch
                        ? "bg-red-300 cursor-not-allowed"
                        : "bg-red-primary hover:brightness-95"
                    }`}
                  >
                    Continue with Wish
                  </button>
                </div>
              </>
            )}

            {/* Footer buttons */}
          </form>
        </div>
      </div>
    </div>
  );
}

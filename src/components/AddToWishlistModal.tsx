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
import { $Enums, Wishlist } from "@prisma/client";
import ModalDropDown from "./ModalDropDown";
import { titleCase } from "@/util/util";

export type AddToWishlistSuggestion = {
  id: number;
  title: string;
  donorOfferId: number | null;
  similarity: number; // 0..1
  strength: "soft" | "hard";
  quantity: number;
};

export type AddToWishlistForm = {
  name: string; // Title
  priority?: $Enums.RequestPriority; // Step 2
  quantity?: number; // Step 2
  comments?: string; // Step 2
};

interface AddToWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Wishlist) => void;
  tutorialState?: {
    step?: 1 | 2;
    form?: Partial<AddToWishlistForm>;
    suggestions?: AddToWishlistSuggestion[];
    hardMatch?: boolean;
  } | null;
}

export default function AddToWishlistModal({
  isOpen,
  onClose,
  onSave,
  tutorialState = null,
}: AddToWishlistModalProps) {
  const { apiClient } = useApiClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<AddToWishlistForm>({
    name: "",
  });

  const [suggestions, setSuggestions] = useState<AddToWishlistSuggestion[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [hardMatch, setHardMatch] = useState<boolean>(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tutorialSuggestions = tutorialState?.suggestions;
  const displaySuggestions = tutorialSuggestions ?? suggestions;
  const isTutorialSuggestions =
    (tutorialSuggestions?.length ?? 0) > 0;
  const effectiveHardMatch =
    tutorialState?.hardMatch ??
    (tutorialSuggestions
      ? tutorialSuggestions.some((hit) => hit.strength === "hard")
      : hardMatch);
  const showSuggestions =
    displaySuggestions.length > 0 && (!searching || Boolean(tutorialSuggestions));

  const suggestionColumns: ColumnDefinition<AddToWishlistSuggestion>[] = [
    {
      id: "title",
      header: "Title",
      cell: (s) => s.title,
      filterType: "string",
    },
    {
      id: "quantity",
      header: "Quantity",
      cell: (s) => s.quantity ?? "-",
      filterType: "number",
    },
  ];

  useEffect(() => {
    if (!isOpen || step !== 1) return;
    if (tutorialState?.suggestions) return;

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
        const resp = await apiClient.get<{
          results?: AddToWishlistSuggestion[];
        }>(url);
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
  }, [form.name, apiClient, isOpen, step, tutorialState]);

  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !tutorialState) return;

    if (tutorialState.step) {
      setStep(tutorialState.step);
    }

    if (tutorialState.form) {
      setForm((currentForm) => ({
        ...currentForm,
        ...tutorialState.form,
      }));
    }

    if (tutorialState.suggestions) {
      setSuggestions(tutorialState.suggestions);
      setHardMatch(
        tutorialState.hardMatch ??
          tutorialState.suggestions.some((hit) => hit.strength === "hard")
      );
      setSearching(false);
      return;
    }

    if (tutorialState.step === 2) {
      setSuggestions([]);
      setHardMatch(false);
      setSearching(false);
    }
  }, [isOpen, tutorialState]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const goToStep2 = () => {
    if (!form.name.trim() || hardMatch) return;
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload: Omit<Wishlist, "id" | "generalItemId" | "partnerId"> = {
      name: form.name.trim(),
      quantity: form.quantity ?? null,
      comments: form.comments?.trim() ?? "",
      priority: form.priority ?? $Enums.RequestPriority.LOW,
      lastUpdated: new Date(),
    };

    await apiClient.post("/api/wishlists", {
      body: JSON.stringify(payload),
    });
    onSave(payload as Wishlist);
  };

  const suggestionFetchFn = async (
    pageSize: number,
    page: number
  ): Promise<TableQuery<AddToWishlistSuggestion>> => {
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
        <div
          className="relative w-full max-w-[720px] rounded-2xl bg-white p-6 md:p-8 shadow-xl"
          data-tutorial="wishlist-modal"
        >
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
                    value={form.name}
                    inputProps={{ "data-tutorial": "wishlist-title-input" }}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, name: e.target.value }));
                      setSuggestions([]);
                    }}
                  />
                </ModalFormRow>

                {/* Suggestions block (red highlighted) */}
                {showSuggestions && (
                  <>
                    <div
                      className="rounded-lg border border-red-primary bg-red-50/50 p-3 md:p-4"
                      data-tutorial="wishlist-suggestions"
                    >
                      <div className="mb-3">
                        {effectiveHardMatch ? (
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

                      {isTutorialSuggestions ? (
                        <div className="overflow-hidden rounded border border-red-primary/25 bg-white">
                          <div className="grid grid-cols-2 bg-red-primary/80 px-4 py-2 text-sm font-medium text-white">
                            <span>Title</span>
                            <span>Quantity</span>
                          </div>
                          {displaySuggestions.map((suggestion) => (
                            <div
                              key={suggestion.id}
                              className="grid grid-cols-2 border-t border-gray-100 px-4 py-2 text-sm text-gray-900"
                            >
                              <span>{suggestion.title}</span>
                              <span>{suggestion.quantity ?? "-"}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <AdvancedBaseTable<AddToWishlistSuggestion>
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
                      )}
                    </div>

                    <div className="mt-6 flex gap-4">
                      <Link
                        href={`/items?initialItems=${encodeURIComponent(
                          JSON.stringify(displaySuggestions.map((s) => s.id))
                        )}`}
                        className="inline-block w-1/2 rounded-lg border border-red-primary px-4 py-2 font-medium text-red-primary hover:bg-red-50 active:translate-y-px text-center"
                      >
                        Go to Items Page
                      </Link>

                      {/* Continue → Step 2 */}
                      <button
                        type="button"
                        onClick={goToStep2}
                        disabled={effectiveHardMatch || !form.name.trim()}
                        className={`w-1/2 rounded-lg px-4 py-2 font-medium text-white active:translate-y-px ${
                          effectiveHardMatch || !form.name.trim()
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
                {!searching && displaySuggestions.length === 0 && form.name !== "" && (
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
                <ModalTextField
                  label="Title"
                  name="name"
                  required
                  value={form.name}
                  className="bg-gray-100 cursor-not-allowed"
                  inputProps={{ readOnly: true }}
                />
                <ModalFormRow>
                  {/* Quantity + Priority (same row) */}
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
                      setForm((f) => ({
                        ...f,
                        priority: priority as $Enums.RequestPriority,
                      }))
                    }
                    defaultSelected={
                      form.priority
                        ? {
                            label:
                              form.priority?.charAt(0) +
                              form.priority?.slice(1).toLowerCase(),
                            value: form.priority,
                          }
                        : undefined
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

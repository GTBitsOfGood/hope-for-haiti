"use client";

import { useEffect, useMemo, useState } from "react";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import { useApiClient } from "@/hooks/useApiClient";
import toast from "react-hot-toast";

type Partner = { name: string };

export interface PartnerRequestChipData {
  id: number;
  partner: Partner;
  quantity: number;
  finalQuantity: number;
}

export default function PartnerRequestChipGroup({
  requests,
  onChange,
  generalItemId,
  onRequestUpdated,
  isLLMMode = false,
}: {
  requests: PartnerRequestChipData[];
  onChange?: (updated: PartnerRequestChipData[]) => void;
  generalItemId?: number;
  onRequestUpdated?: (itemId?: number, updatedRequests?: PartnerRequestChipData[]) => void;
  isLLMMode?: boolean;
}) {
  const [data, setData] = useState<PartnerRequestChipData[]>(() =>
    requests.map((r) => ({ ...r }))
  );

  useEffect(() => {
    setData(requests.map((r) => ({ ...r })));
  }, [requests]);

  useEffect(() => {
    onChange?.(data);
  }, [data, onChange]);

  const sorted = useMemo(
    () =>
      [...data].sort((a, b) => a.partner.name.localeCompare(b.partner.name)),
    [data]
  );

  return (
    <div className="w-full bg-gray-50 flex flex-wrap gap-2 p-3">
      {sorted.length === 0 ? (
        <p className="w-full text-center text-gray-500">No partner requests.</p>
      ) : (
        sorted.map((req) => (
          <PartnerRequestChip
            key={req.id}
            request={req}
            generalItemId={generalItemId}
            isLLMMode={isLLMMode}
            onSave={(finalQuantity) => {
              const updatedData = data.map((p) => (p.id === req.id ? { ...p, finalQuantity } : p));
              setData(updatedData);
              onRequestUpdated?.(generalItemId, updatedData);
            }}
          />
        ))
      )}
    </div>
  );
}

function PartnerRequestChip({
  request,
  onSave,
  generalItemId,
  isLLMMode = false,
}: {
  request: PartnerRequestChipData;
  onSave: (finalQuantity: number) => void;
  generalItemId?: number;
  isLLMMode?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(String(request.finalQuantity));
  const [isSaving, setIsSaving] = useState(false);
  const [distToNavbar, setDistToNavbar] = useState(0);
  const popRef = useOnClickOutside<HTMLDivElement>(() => setOpen(false));
  const { apiClient } = useApiClient();

  useEffect(() => {
    setInputValue(String(request.finalQuantity));
  }, [request.finalQuantity]);

  useEffect(() => {
    const navbar = document.getElementById("navbar");
    if (!navbar || !popRef.current || !open) return;

    const navbarRect = navbar.getBoundingClientRect();
    const dropdownRect = popRef.current.getBoundingClientRect();

    console.log(dropdownRect.left - navbarRect.right);
    setDistToNavbar(dropdownRect.left - navbarRect.right);
  }, [popRef, open]);

  const different = request.finalQuantity !== request.quantity;

  const handleSave = async () => {
    const parsed = Number(inputValue);
    if (!Number.isFinite(parsed) || parsed < 0) return;

    setIsSaving(true);
    try {
      // Only make API call if not in LLM mode
      if (generalItemId && !isLLMMode) {
        await apiClient.patch(
          `/api/generalItems/${generalItemId}/requests/${request.id}`,
          {
            body: JSON.stringify({ finalQuantity: parsed }),
          }
        );
        toast.success("Quantity updated successfully");
      }
      onSave(Math.floor(parsed));
      setOpen(false);
    } catch (error) {
      toast.error("Failed to update quantity");
      console.error("Update error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg border border-[#6193bb] px-3 py-1 text-sm flex items-center gap-2 hover:shadow bg-white"
      >
        <span className="text-[#6193bb]">{request.partner.name}</span>
        <span className="flex items-center gap-1">
          <span className={`text-gray-600 ${different ? "line-through" : ""}`}>{request.quantity}</span>
          {different && (
            <span className="rounded text-[#6193bb] bg-[#4d93c2]/30 font-bold px-1 py-0.5 text-xs">
              {request.finalQuantity}
            </span>
          )}
        </span>
      </button>

      <div
        ref={popRef}
        className={`absolute ${distToNavbar < 50 ? "left-0" : "right-0"} top-full mt-1 z-50 w-56 bg-white border border-gray-primary/20 rounded shadow-lg p-2 text-sm ${
          open ? "block" : "hidden"
        }`}
      >
        <div className="mb-2">
          <label className="block text-xs text-gray-primary/70 mb-1">
            Revised quantity
          </label>
          <input
            type="number"
            min={0}
            value={inputValue}
            onChange={(e) => setInputValue(e.currentTarget.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-3 py-1 rounded border border-gray-primary/20 text-gray-primary hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded bg-blue-primary text-white hover:bg-blue-600 disabled:opacity-50"
            disabled={
              !Number.isFinite(Number(inputValue)) ||
              Number(inputValue) < 0 ||
              isSaving
            }
            onClick={handleSave}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

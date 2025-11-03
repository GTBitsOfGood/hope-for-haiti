"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import toast from "react-hot-toast";
import Chip from "./Chip";

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
  onRequestUpdated?: (
    itemId?: number,
    updatedRequests?: PartnerRequestChipData[]
  ) => void;
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
              const updatedData = data.map((p) =>
                p.id === req.id ? { ...p, finalQuantity } : p
              );
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
  const [inputValue, setInputValue] = useState(String(request.finalQuantity));
  const [isSaving, setIsSaving] = useState(false);
  const { apiClient } = useApiClient();

  const setIsDropdownOpenRef = useRef<
    React.Dispatch<React.SetStateAction<boolean>>
  >(() => {});

  useEffect(() => {
    setInputValue(String(request.finalQuantity));
  }, [request.finalQuantity]);

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
    } catch (error) {
      toast.error("Failed to update quantity");
      console.error("Update error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Chip
      title={request.partner.name}
      revisedAmount={request.finalQuantity}
      setIsDropdownOpenRef={setIsDropdownOpenRef}
      popover={
        <>
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
              onClick={() => setIsDropdownOpenRef.current?.(false)}
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
        </>
      }
    />
  );
}

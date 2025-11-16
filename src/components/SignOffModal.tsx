"use client";

import React, { useRef, useState, useEffect } from "react";
import { X } from "@phosphor-icons/react";
import SignatureCanvas from "react-signature-canvas";
import { useUser } from "./context/UserContext";
import { useApiClient } from "@/hooks/useApiClient";
import { useFetch } from "@/hooks/useFetch";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface SignOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedAllocationIds: number[];
  partnerId: number;
  partnerName: string;
}

export default function SignOffModal({
  isOpen,
  onClose,
  onSuccess,
  selectedAllocationIds,
  partnerId,
  partnerName,
}: SignOffModalProps) {
  const { user } = useUser();
  const { apiClient } = useApiClient();
  const signatureCanvasRef = useRef<SignatureCanvas>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: userData } = useFetch<{
    user: { name: string; email: string };
  }>(user?.id ? `/api/users/${user.id}` : "");

  const staffName = userData?.user?.name || userData?.user?.email || "";
  const currentDate = new Date();

  useEffect(() => {
    if (isOpen && signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!signatureCanvasRef.current) {
      toast.error("Please provide a signature");
      return;
    }

    if (signatureCanvasRef.current.isEmpty()) {
      toast.error("Please provide a signature");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get base64 PNG data from canvas
      const base64Data = signatureCanvasRef.current
        .getCanvas()
        .toDataURL("image/png");

      const formData = new FormData();
      formData.append("partnerId", partnerId.toString());
      formData.append("staffName", staffName);
      formData.append("partnerName", partnerName);
      formData.append("date", currentDate.toISOString());
      formData.append("signatureUrl", base64Data);
      selectedAllocationIds.forEach((id) => {
        formData.append("allocation", id.toString());
      });

      await apiClient.post("/api/signOffs", {
        body: formData,
      });

      toast.success("Items signed off successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create sign-off:", error);
      toast.error("Failed to create sign-off. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-lg text-[#22070B]">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700"
        >
          <X className="size-6" />
        </button>
        <h2 className="text-[20px] font-semibold leading-[28px] mb-4">
          Sign Off Items
        </h2>

        <div className="space-y-4">
          {/* Staff Name - Readonly */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff Name
            </label>
            <input
              type="text"
              value={staffName}
              readOnly
              className="w-full rounded-[4px] border border-[rgba(34,7,11,0.05)] bg-[rgba(34,7,11,0.05)] text-[16px] p-3 cursor-not-allowed"
            />
          </div>

          {/* Date and Time - Readonly */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date and Time
            </label>
            <input
              type="text"
              value={format(currentDate, "MMM d, yyyy 'at' h:mm a")}
              readOnly
              className="w-full rounded-[4px] border border-[rgba(34,7,11,0.05)] bg-[rgba(34,7,11,0.05)] text-[16px] p-3 cursor-not-allowed"
            />
          </div>

          {/* Signature Canvas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Signature
            </label>
            <div className="border-2 border-gray-300 rounded-[4px] bg-white">
              <SignatureCanvas
                ref={signatureCanvasRef}
                canvasProps={{
                  className: "w-full h-48",
                }}
                backgroundColor="white"
              />
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="mt-2 text-sm text-blue-primary hover:text-blue-primary/80"
            >
              Clear Signature
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="bg-white hover:bg-gray-100 text-[#EF3340] border-2 border-[#EF3340] font-semibold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#EF3340] hover:bg-[#a32027] text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

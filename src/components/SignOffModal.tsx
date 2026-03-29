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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: userData } = useFetch<{
    user: { name: string; email: string };
  }>(user?.id ? `/api/users/${user.id}` : "");

  const staffName = userData?.user?.name || userData?.user?.email || "";
  const currentDate = new Date();
  const staffSignatureCanvasRef = useRef<SignatureCanvas>(null);
  const partnerSignatureCanvasRef = useRef<SignatureCanvas>(null);
  const [partnerSignerName, setPartnerSignerName] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    staffSignatureCanvasRef.current?.clear();
    partnerSignatureCanvasRef.current?.clear();
    setPartnerSignerName("");
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!partnerSignerName.trim()) {
      toast.error("Please enter the partner name");
      return;
    }

    if (!staffSignatureCanvasRef.current || !partnerSignatureCanvasRef.current) {
      toast.error("Please provide both signatures");
      return;
    }

    if (
      staffSignatureCanvasRef.current.isEmpty() ||
      partnerSignatureCanvasRef.current.isEmpty()
    ) {
      toast.error("Please provide both signatures");
      return;
    }

    setIsSubmitting(true);

    try {
      const signatureUrl = staffSignatureCanvasRef.current
        .getCanvas()
        .toDataURL("image/png");
      const partnerSignatureUrl = partnerSignatureCanvasRef.current
        .getCanvas()
        .toDataURL("image/png");

      const formData = new FormData();
      formData.append("partnerId", partnerId.toString());
      formData.append("partnerName", partnerName);
      formData.append("partnerSignerName", partnerSignerName);
      formData.append("staffName", staffName);
      formData.append("date", currentDate.toISOString());
      formData.append("signatureUrl", signatureUrl);
      formData.append("partnerSignatureUrl", partnerSignatureUrl);

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

  const clearStaffSignature = () => staffSignatureCanvasRef.current?.clear();
  const clearPartnerSignature = () => partnerSignatureCanvasRef.current?.clear();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-6">
      <div className="relative mx-auto flex max-h-[calc(100dvh-3rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white text-gray-primary shadow-lg">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700"
        >
          <X className="size-6" />
        </button>
        <div className="shrink-0 border-b border-gray-200 px-6 py-5 pr-14">
          <h2 className="text-xl font-semibold leading-7">
            Sign Off Items
          </h2>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Staff Name
              </label>
              <input
                type="text"
                value={staffName}
                readOnly
                className="w-full rounded-sm border border-gray-primary/10 bg-sunken p-3 text-base text-gray-primary cursor-not-allowed"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Date and Time
              </label>
              <input
                type="text"
                value={format(currentDate, "MMM d, yyyy 'at' h:mm a")}
                readOnly
                className="w-full rounded-sm border border-gray-primary/10 bg-sunken p-3 text-base text-gray-primary cursor-not-allowed"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Signature
              </label>
              <div className="rounded-sm border-2 border-gray-primary/20 bg-white">
                <SignatureCanvas
                  ref={staffSignatureCanvasRef}
                  canvasProps={{
                    className: "h-40 w-full sm:h-48",
                  }}
                  backgroundColor="white"
                />
              </div>
              <button
                type="button"
                onClick={clearStaffSignature}
                className="mt-2 text-sm text-blue-primary hover:text-blue-primary/80"
              >
                Clear Signature
              </button>
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-200 pt-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Partner Name
              </label>
              <input
                type="text"
                value={partnerSignerName}
                onChange={(e) => setPartnerSignerName(e.target.value)}
                className="w-full rounded-sm border border-gray-primary/10 bg-sunken p-3 text-base text-gray-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Date and Time
              </label>
              <input
                type="text"
                value={format(currentDate, "MMM d, yyyy 'at' h:mm a")}
                readOnly
                className="w-full rounded-sm border border-gray-primary/10 bg-sunken p-3 text-base text-gray-primary cursor-not-allowed"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Signature
              </label>
              <div className="rounded-sm border-2 border-gray-primary/20 bg-white">
                <SignatureCanvas
                  ref={partnerSignatureCanvasRef}
                  canvasProps={{
                    className: "h-40 w-full sm:h-48",
                  }}
                  backgroundColor="white"
                />
              </div>
              <button
                type="button"
                onClick={clearPartnerSignature}
                className="mt-2 text-sm text-blue-primary hover:text-blue-primary/80"
              >
                Clear Signature
              </button>
            </div>
          </div>
        </div>

        <div className="mt-auto flex shrink-0 justify-end gap-4 border-t border-gray-200 bg-white px-6 py-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md border-2 border-red-primary bg-white px-4 py-2 font-semibold text-red-primary hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-md bg-red-primary px-4 py-2 font-semibold text-white hover:bg-red-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

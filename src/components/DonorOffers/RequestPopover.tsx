"use client";

import React, { useState, useEffect } from "react";
import { RequestPriority } from "@prisma/client";
import Portal from "@/components/baseTable/Portal";

interface RequestPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { quantity: number; priority: RequestPriority; comments: string }) => void;
  initialData?: {
    quantity: number;
    priority: RequestPriority | null;
    comments: string | null;
  };
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  item: {
    requestId: number | null;
    donorOfferItemId: number;
  };
}

const getPriorityColor = (priority: RequestPriority | ""): string => {
  switch (priority) {
    case "LOW":
      return "rgba(10,123,64,0.2)";
    case "MEDIUM":
      return "rgba(236,97,11,0.2)";
    case "HIGH":
      return "rgba(239,51,64,0.2)";
    default:
      return "rgba(249,249,249)";
  }
};

export default function RequestPopover({
  isOpen,
  onClose,
  onSave,
  initialData,
  buttonRef,
  item,
}: RequestPopoverProps) {
  const [quantity, setQuantity] = useState<string>(
    initialData?.quantity ? initialData.quantity.toString() : ""
  );
  const [priority, setPriority] = useState<RequestPriority | "">(
    initialData?.priority || ""
  );
  const [comments, setComments] = useState(initialData?.comments || "");

  useEffect(() => {
    setQuantity(initialData?.quantity ? initialData.quantity.toString() : "");
    setPriority(initialData?.priority || "");
    setComments(initialData?.comments || "");
  }, [initialData]);

  const handleSave = () => {
    const quantityNum = parseInt(quantity) || 0;
    
    if (priority === "") {
      return;
    }
    if (quantityNum <= 0) {
      return;
    }
    
    onSave({
      quantity: quantityNum,
      priority: priority as RequestPriority,
      comments,
    });
    onClose();
  };

  return (
    <Portal
      isOpen={isOpen}
      onClose={onClose}
      triggerRef={buttonRef}
      position="right"
      className="w-80 bg-white border border-gray-300 rounded-lg shadow-lg p-4"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
            placeholder="Enter quantity"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as RequestPriority | "")}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
            style={{
              backgroundColor: getPriorityColor(priority),
            }}
          >
            <option value="">Select Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comments
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none"
            placeholder="Optional comments..."
          />
        </div>

        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-medium rounded border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={priority === "" || (parseInt(quantity) || 0) <= 0}
            className={`px-4 py-2 text-white font-medium rounded ${
              priority === "" || (parseInt(quantity) || 0) <= 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {item.requestId ? "Update Request" : "Add Request"}
          </button>
        </div>
      </div>
    </Portal>
  );
}

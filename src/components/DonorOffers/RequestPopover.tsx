"use client";

import React, { useState, useRef, useEffect } from "react";
import { RequestPriority } from "@prisma/client";

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
}: RequestPopoverProps) {
  const [quantity, setQuantity] = useState<string>(
    initialData?.quantity ? initialData.quantity.toString() : ""
  );
  const [priority, setPriority] = useState<RequestPriority | "">(
    initialData?.priority || ""
  );
  const [comments, setComments] = useState(initialData?.comments || "");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calculate position based on button position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      const popoverWidth = 320; // 320px (w-80)
      const popoverHeight = 300; // Approximate height
      const horizontalGap = 8; // Gap between button and popover
      const verticalOffset = 8; // Small vertical offset
      
      // Position popover to the left of the button with a gap
      let top = buttonRect.bottom + scrollTop - popoverHeight + verticalOffset;
      let left = buttonRect.left + scrollLeft - popoverWidth - horizontalGap;
      
      // Prevent popover from going off-screen
      
      // Check if popover goes off left edge
      if (left < scrollLeft) {
        // If it goes off the left, position it to the right of the button instead
        left = buttonRect.right + scrollLeft + horizontalGap;
      }
      
      // Check if popover goes off right edge (when positioned to the right)
      if (left + popoverWidth > window.innerWidth + scrollLeft) {
        // Position it back to the left but with minimum margin
        left = scrollLeft + 8; // 8px margin from left edge
      }
      
      // Check if popover goes off top edge
      if (top < scrollTop) {
        top = buttonRect.bottom + scrollTop + 4; // Show below button with small gap
      }
      
      // Check if popover goes off bottom edge
      if (top + popoverHeight > window.innerHeight + scrollTop) {
        top = buttonRect.top + scrollTop - popoverHeight - 4; // Show above button
      }
      
      setPosition({ top, left });
    }
  }, [isOpen, buttonRef]);

  // Reset form when initialData changes
  useEffect(() => {
    setQuantity(initialData?.quantity ? initialData.quantity.toString() : "");
    setPriority(initialData?.priority || "");
    setComments(initialData?.comments || "");
  }, [initialData]);

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  const handleSave = () => {
    const quantityNum = parseInt(quantity) || 0;
    
    if (priority === "") {
      return; // Don't save without priority
    }
    if (quantityNum <= 0) {
      return; // Don't save if quantity is 0 or invalid
    }
    
    onSave({
      quantity: quantityNum,
      priority: priority as RequestPriority,
      comments,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="space-y-4">
        {/* Quantity Input */}
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

        {/* Priority Select */}
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

        {/* Comments Textarea */}
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

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={priority === "" || (parseInt(quantity) || 0) <= 0}
            className={`px-4 py-2 text-white font-medium rounded ${
              priority === "" || (parseInt(quantity) || 0) <= 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
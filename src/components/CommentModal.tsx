"use client";

import React, { useEffect, useState } from "react";

interface CommentModalProps {
  isOpen: boolean;
  title: string;
  initialValue?: string;
  placeholder?: string;
  onClose: () => void; // invoked on cancel/close (no value change)
  onSave: (value: string) => void; // invoked when clicking Save
}

export default function CommentModal({
  isOpen,
  title,
  initialValue = "",
  placeholder = "Comment about this item here...",
  onClose,
  onSave,
}: CommentModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    // keep draft in sync when opening for a different item
    if (isOpen) setValue(initialValue ?? "");
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-lg text-[#22070B]">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>
        <h2 className="text-[20px] font-semibold leading-[28px] mb-2">{title}</h2>
        <p className="text-[16px] leading-[24px] mb-2">Comments</p>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[150px] rounded-[4px] border border-[rgba(34,7,11,0.05)] bg-[rgba(34,7,11,0.05)] text-[16px] p-3 focus:outline-none focus:ring-1 focus:ring-[rgba(34,7,11,0.1)] resize-none"
        />
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-white hover:bg-gray-100 text-[#EF3340] border-2 border-[#EF3340] font-semibold py-2 px-4 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(value)}
            className="bg-[#EF3340] hover:bg-[#a32027] text-white font-semibold py-2 px-4 rounded-md"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

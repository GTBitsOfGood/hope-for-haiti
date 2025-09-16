"use client";

import React, { useEffect, useState } from "react";
import { X } from "@phosphor-icons/react";
import ModalTextField from "./ModalTextField";

interface CommentModalProps {
  isOpen: boolean;
  title: string;
  initialValue?: string;
  placeholder?: string;
  onClose: () => void; // invoked on cancel/close (no value change)
  onSave: (value: string) => void; // invoked when clicking Save
  // Optional props for enhanced functionality
  useModalTextField?: boolean; // Use ModalTextField instead of textarea
  width?: string; // Custom width (default: max-w-lg)
  saveButtonText?: string; // Custom save button text
  cancelButtonText?: string; // Custom cancel button text
  fieldName?: string; // Name attribute for ModalTextField
  onFieldChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; // For external state management
}

export default function CommentModal({
  isOpen,
  title,
  initialValue = "",
  placeholder = "Comment about this item here...",
  onClose,
  onSave,
  useModalTextField = false,
  width = "max-w-lg",
  saveButtonText = "Save",
  cancelButtonText = "Cancel",
  fieldName = "comments",
  onFieldChange,
}: CommentModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    // keep draft in sync when opening for a different item
    if (isOpen) setValue(initialValue ?? "");
  }, [isOpen, initialValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (onFieldChange) {
      onFieldChange(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className={`relative bg-white rounded-2xl p-6 w-full ${width} shadow-lg text-[#22070B]`}>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700"
        >
          <X className="size-6" />
        </button>
        <h2 className="text-[20px] font-semibold leading-[28px] mb-2">{title}</h2>
        <p className="text-[16px] leading-[24px] mb-2">Comments</p>
        
        {useModalTextField ? (
          <ModalTextField
            name={fieldName}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
          />
        ) : (
          <textarea
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full min-h-[150px] rounded-[4px] border border-[rgba(34,7,11,0.05)] bg-[rgba(34,7,11,0.05)] text-[16px] p-3 focus:outline-none focus:ring-1 focus:ring-[rgba(34,7,11,0.1)] resize-none"
          />
        )}
        
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-white hover:bg-gray-100 text-[#EF3340] border-2 border-[#EF3340] font-semibold py-2 px-4 rounded-md"
          >
            {cancelButtonText}
          </button>
          <button
            onClick={() => onSave(value)}
            className="bg-[#EF3340] hover:bg-[#a32027] text-white font-semibold py-2 px-4 rounded-md"
          >
            {saveButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}

import { X } from "@phosphor-icons/react";
import { ReactNode } from "react";

interface GeneralModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  children: ReactNode;
}

export default function GeneralModal({
  title,
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "bg-red-primary hover:bg-red-primary/80 text-white",
  children,
}: GeneralModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-black font-bold">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 pt-4">{children}</div>

        <div className="flex items-center justify-end gap-3 p-6">
          <button
            onClick={onCancel}
            className="px-8 py-1.5 text-red-primary bg-white border border-red-primary rounded-md hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-1.5 rounded-md border border-red-primary transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

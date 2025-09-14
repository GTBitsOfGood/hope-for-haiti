import { ReactNode } from "react";
import GeneralModal from "./GeneralModal";

interface ConfirmationModalProps {
  title: string;
  text: string;
  icon: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

export default function ConfirmationModal({
  title,
  text,
  icon,
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "bg-red-500 hover:bg-red-600 text-white",
}: ConfirmationModalProps) {
  return (
    <GeneralModal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmText={confirmText}
      cancelText={cancelText}
      confirmButtonClass={confirmButtonClass}
    >
      <div className="text-center">
        <p className="text-gray-primary/70 text-left mb-2 leading-relaxed">
          {text}
        </p>

        <div className="flex justify-center mb-4">
          <div className="text-black">{icon}</div>
        </div>
      </div>
    </GeneralModal>
  );
}

import { X } from "@phosphor-icons/react";
import ModalTextField from "./ModalTextField";
import ModalFormRow from "./ModalFormRow";

interface AddItemModalProps {
  setIsOpen: (isOpen: boolean) => void; // Explicitly typing setIsOpen
}

export default function BulkAddSuccessModal({ setIsOpen }: AddItemModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
      <div className="bg-white p-8 rounded-lg shadow-lg w-[600px] relative">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Add new item</h2>
          <X
            onClick={() => setIsOpen(false)}
            size={24}
            className="cursor-pointer"
          />
        </div>
        <p className="text-xs mb-4">
          Fields marked with <span className="text-red-500">*</span> are
          required
        </p>
        <div className="max-h-[80vh] overflow-auto pr-4">
          <ModalFormRow>
            <ModalTextField label="Item title" required />
            <ModalTextField label="Donor name" required />
            {/* To be replaced with dropdown */}
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField label="Item category" required />
            {/* To be replaced with dropdown */}
            <ModalTextField label="Item type" required />
            {/* To be replaced with dropdown */}
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField label="Lot number" required />
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField label="Expiration date" required />
            {/* To be replaced with date field */}
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField label="NDC" />
            {/* To be replaced with numeric field */}
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField label="Quantity" />
            {/* To be replaced with numeric field */}
            <ModalTextField label="Unit type" />
            {/* To be replaced with special dropdown */}
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField label="Unit price" />
            <ModalTextField label="Quantity per unit" />
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField label="Pallet number" />
            <ModalTextField label="Box number" />
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField label="Donor shipping number" />
            <ModalTextField label="HfH shipping number" />
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField label="Maximum limit requested" />
          </ModalFormRow>
        </div>
      </div>
    </div>
  );
}

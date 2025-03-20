import { X } from "@phosphor-icons/react";
import ModalTextField from "./ModalTextField";
import ModalFormRow from "./ModalFormRow";
import ModalLongTextField from "./ModalLongTextField";
import ModalToggleField from "./ModalToggleField";

interface AddItemModalProps {
  setIsOpen: (isOpen: boolean) => void; // Explicitly typing setIsOpen
}

export default function BulkAddSuccessModal({ setIsOpen }: AddItemModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
      <div className="flex flex-col bg-white p-8 rounded-lg shadow-lg w-[600px] relative max-h-[90vh]">
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
        <form className="overflow-auto pr-4 flex flex-col gap-y-4">
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
            <ModalTextField label="Quantity" required />
            {/* To be replaced with numeric field */}
            <ModalTextField label="Unit type" required />
            {/* To be replaced with special dropdown */}
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField label="Unit price" required />
            <ModalTextField label="Quantity per unit" required />
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField label="Pallet number" required />
            <ModalTextField label="Box number" required />
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField label="Donor shipping number" required />
            <ModalTextField label="HfH shipping number" required />
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField label="Maximum limit requested" required />
          </ModalFormRow>
          <ModalFormRow>
            <ModalLongTextField
              label="Notes"
              placeholder="Add additional notes about this item here."
            />
          </ModalFormRow>
          <ModalFormRow>
            <ModalToggleField
              label="Make item visible to partners?"
              description="Once visible, partners will be able to request this item in their distribution."
            />
          </ModalFormRow>
          <ModalFormRow>
            <ModalToggleField
              label="Allow allocations?"
              description="Once allowed, item can be added to a partner's pending distribution."
            />
          </ModalFormRow>
          <ModalFormRow>
            <ModalToggleField
              label="Mark item as GIK?"
              description="GIK items are (definition of GIK items)."
            />
            {/* Description to be updated with actual definition */}
          </ModalFormRow>
          <ModalFormRow>
            <button
              className="block grow border border-red-500 text-center text-red-500 bg-white py-1 px-4 rounded-lg font-medium hover:bg-red-50 transition"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="block grow bg-red-500 text-center text-white py-1 px-4 rounded-lg font-medium hover:bg-red-600 transition"
            >
              Add item
            </button>
          </ModalFormRow>
        </form>
      </div>
    </div>
  );
}

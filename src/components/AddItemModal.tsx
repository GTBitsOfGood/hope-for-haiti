import { X } from "@phosphor-icons/react";
import ModalTextField from "./ModalTextField";
import ModalFormRow from "./ModalFormRow";
import ModalLongTextField from "./ModalLongTextField";
import ModalToggleField from "./ModalToggleField";
import { ItemFormSchema } from "@/schema/itemForm";
import submitHandler from "@/util/formAction";
import ModalDateField from "./ModalDateField";
import toast from "react-hot-toast";
import ModalDropDown from "./ModalDropDown";
import { ItemCategory } from "@prisma/client";
import ModalAutoTextField from "./ModalAutoTextField";

interface AddItemModalProps {
  setIsOpen: (isOpen: boolean) => void; // Explicitly typing setIsOpen
  unitTypes: string[]; // All the unit types
  donorNames: string[]; // All the donor names
  itemTypes: string[]; // All the item types
  formSuccess: (formSuccess: boolean) => void;
}

export default function BulkAddSuccessModal({
  setIsOpen,
  unitTypes,
  donorNames,
  itemTypes,
  formSuccess,
}: AddItemModalProps) {
  const submitItem = submitHandler(async (data: FormData) => {
    console.log(Object.fromEntries(data)); // Log the form data for
    data.append("datePosted", new Date().toISOString()); // Add datePosted to the form data

    const validatedForm = ItemFormSchema.safeParse(data);
    console.log(validatedForm);

    //just logging errors directly from ZOD for now; there are probably more user-friendly ways to do this
    if (!validatedForm.success) {
      for (const issue of validatedForm.error.issues) {
        toast.error(`${issue.path.join(".")}: ${issue.message}`); // Log validation errors
      }
      return;
    }

    const response = await fetch("/api/items", {
      method: "POST",
      body: data,
    });
    if (response.ok) {
      const json = await response.json();
      console.log(json); // Log the response from the server
      toast.success("Item added successfully!");
      formSuccess(true); // Call the formSuccess function with true
      setIsOpen(false); // Close the modal on success
    } else if (response.status === 400) {
      toast.error("Invalid form data. Please check your inputs.");
    } else if (response.status === 403) {
      toast.error("You are not authorized to add this item.");
    } else {
      toast.error("An unknown error occurred. Please try again.");
    }
  });
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
      <div className="flex flex-col bg-white p-8 rounded-lg shadow-lg w-[600px] relative max-h-[90vh] text-gray-primary">
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
        <form
          className="overflow-auto pr-4 flex flex-col gap-y-4"
          onSubmit={submitItem}
        >
          <ModalFormRow>
            <ModalTextField label="Item title" name="title" required />
            <ModalAutoTextField
              label="Donor name"
              name="donorName"
              options={donorNames}
              required
            />
          </ModalFormRow>
          <ModalFormRow>
            <ModalDropDown
              label="Item category"
              name="category"
              options={[
                { label: "medication", value: ItemCategory.MEDICATION },
                { label: "medical supply", value: ItemCategory.MEDICAL_SUPPLY },
                { label: "non medical", value: ItemCategory.NON_MEDICAL },
                { label: "purchases", value: ItemCategory.PURCHASES },
              ]}
              required
            />
            <ModalAutoTextField
              label="Item type"
              name="type"
              options={itemTypes}
              required
            />
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField label="Lot number" name="lotNumber" required />
          </ModalFormRow>
          <ModalFormRow>
            <ModalDateField
              label="Expiration Date"
              name="expirationDate"
              required
            />
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField label="NDC" name="ndc" placeholder="xxxx-xxxx-xx" />
            {/* To be replaced with numeric field; note that this is currently not being tracked in the db*/}
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField
              label="Quantity"
              name="quantity"
              type="number"
              required
            />
            {/* To be replaced with numeric field */}
            <ModalAutoTextField
              label="Unit type"
              name="unitType"
              required
              options={unitTypes}
            />
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField
              label="Unit price"
              name="unitPrice"
              type="number"
              inputProps={{ step: ".01" }}
              required
            />
            <ModalTextField
              label="Quantity per unit"
              name="quantityPerUnit"
              type="number"
              required
            />
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField
              label="Pallet"
              name="palletNumber"
              required
            />
            <ModalTextField label="Box number" name="boxNumber" required />
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField
              label="Donor shipping number"
              name="donorShippingNumber"
              required
            />
            <ModalTextField
              label="HfH shipping number"
              name="hfhShippingNumber"
              required
            />
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField
              label="Maximum limit requested"
              name="maxRequestLimit"
              required
            />
          </ModalFormRow>
          <ModalFormRow>
            <ModalLongTextField
              label="Notes"
              placeholder="Add additional notes about this item here."
              name="notes"
            />
            {/* need to add column in database schema for this?*/}
          </ModalFormRow>
          <ModalFormRow>
            <ModalToggleField
              label="Make item visible to partners?"
              description="Once visible, partners will be able to request this item in their distribution."
              name="visible"
            />
          </ModalFormRow>
          <ModalFormRow>
            <ModalToggleField
              label="Allow allocations?"
              description="Once allowed, item can be added to a partner's pending distribution."
              name="allowAllocations"
            />
          </ModalFormRow>
          <ModalFormRow>
            <ModalToggleField
              label="Mark item as GIK?"
              description="GIK items are items that are donated."
              name="gik"
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

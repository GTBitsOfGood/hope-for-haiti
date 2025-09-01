"use client";
import React, { useEffect, useState } from "react";

import submitHandler from "@/util/formAction";
import { X } from "@phosphor-icons/react";
import ModalFormRow from "./ModalFormRow";
import ModalTextField from "./ModalTextField";
import ModalAutoTextField from "./ModalAutoTextField";
import toast from "react-hot-toast";
import { editAllocationFormSchema } from "@/schema/unAllocatedItemRequestForm";
import { UnallocatedItem } from "@/types/api/unallocatedItem.types";
import { Item, UnallocatedItemRequestAllocation } from "@prisma/client";

interface EditAllocationModalProps {
  setIsOpen: (isOpen: boolean) => void; // Explicitly typing setIsOpen
  items: UnallocatedItem[];
  allocation: UnallocatedItemRequestAllocation & { unallocatedItem: Item };
  unitType: string;
  quantityPerUnit: number;
  expirationDate: string | null;
  title: string;
  type: string;
  setIsSuccess: (isSuccess: boolean) => void;
}

export default function EditAllocationModal({
  setIsOpen,
  items,
  allocation,
  unitType,
  quantityPerUnit,
  expirationDate,
  title,
  type,
  setIsSuccess,
}: EditAllocationModalProps) {
  const [donorName, setDonorName] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [palletNumber, setPalletNumber] = useState("");
  const [boxNumber, setBoxNumber] = useState("");
  const [quantity, setQuantity] = useState("");

  // Dynamically filter items based on the current input values
  const filteredItems = items.filter((item) => {
    return (
      (!donorName || item.donorName.includes(donorName)) &&
      (!lotNumber || item.lotNumber.toString().includes(lotNumber)) &&
      (!palletNumber || item.palletNumber.toString().includes(palletNumber)) &&
      (!boxNumber || item.boxNumber.toString().includes(boxNumber))
    );
  });

  // useEffect(() => {
  //   console.log("Filtered Items:", filteredItems);
  // }, [filteredItems]);

  const submitItem = submitHandler(async (data: FormData) => {
    data.append("allocationId", allocation.id.toString());
    data.append("unitType", unitType);
    data.append("quantityPerUnit", quantityPerUnit.toString());
    if (expirationDate)
      data.append("expirationDate", expirationDate.toString());
    data.append("title", title);
    data.append("type", type);
    console.log("Form Data:", Object.fromEntries(data)); // Log the form data for debugging

    const validatedForm = editAllocationFormSchema.safeParse(data);
    console.log(validatedForm);

    //just logging errors directly from ZOD for now; there are probably more user-friendly ways to do this
    if (!validatedForm.success) {
      for (const issue of validatedForm.error.issues) {
        toast.error(`${issue.path.join(".")}: ${issue.message}`); // Log validation errors
      }
      return;
    }

    const response = await fetch("/api/allocations", {
      method: "PUT",
      body: data,
    });
    const res = await response.json();
    if (response.ok) {
    } else if (response.status === 400) {
      toast.error("Invalid form data. Please check your inputs.");
    } else if (response.status === 403) {
      toast.error("You are not authorized to edit this allocation.");
    } else if (response.status === 404) {
      if (res.message === "Allocation not found") {
        toast.error(
          "Allocation not found. Please select the allocation request again."
        );
      } else if (res.message === "Item not found") {
        toast.error("Item not found. Please check the details.");
      } else {
        toast.error("An unknown error occurred. Please try again.");
      }
    } else {
      toast.error("An unknown error occurred. Please try again.");
    }
    if (!response.ok) {
      console.error("Error response:", res); // Log the error response
      return;
    }

    console.log(res); // Log the response from the server

    setIsSuccess(true); // Set success state to true
    setIsOpen(false); // Close the modal on success
  });

  // Set initial values for the form fields when the component mounts
  useEffect(() => {
    if (allocation) {
      setDonorName(allocation.unallocatedItem.donorName);
      setLotNumber(allocation.unallocatedItem.lotNumber.toString());
      setPalletNumber(allocation.unallocatedItem.palletNumber.toString());
      setBoxNumber(allocation.unallocatedItem.boxNumber.toString());
      setQuantity(allocation.quantity.toString());
    }
  }, [allocation]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
      <div className="flex flex-col bg-white p-8 rounded-lg shadow-lg w-[500px] relative max-h-[90vh] text-gray-primary">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Edit Allocation</h2>
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
            <ModalAutoTextField
              label="Donor Name"
              name="donorName"
              options={[
                ...new Set(filteredItems.map((item) => item.donorName)),
              ]} // Unique donor names
              onInputChange={setDonorName}
              defaultValue={donorName}
              required
            />
          </ModalFormRow>
          <ModalFormRow>
            <ModalAutoTextField
              label="Lot Number"
              name="lotNumber"
              options={[
                ...new Set(
                  filteredItems.map((item) => item.lotNumber.toString())
                ),
              ]} // Unique lot numbers
              onInputChange={setLotNumber}
              defaultValue={lotNumber}
              required
            />
          </ModalFormRow>
          <ModalFormRow>
            <ModalAutoTextField
              label="Pallet"
              name="palletNumber"
              options={[
                ...new Set(
                  filteredItems.map((item) => item.palletNumber.toString())
                ),
              ]} // Unique pallet numbers
              onInputChange={setPalletNumber}
              defaultValue={palletNumber}
              required
            />
          </ModalFormRow>
          <ModalFormRow>
            <ModalAutoTextField
              label="Box Number"
              name="boxNumber"
              options={[
                ...new Set(
                  filteredItems.map((item) => item.boxNumber.toString())
                ),
              ]} // Unique box numbers
              onInputChange={setBoxNumber}
              defaultValue={boxNumber}
              required
            />
          </ModalFormRow>
          <ModalFormRow>
            <ModalTextField
              label="Quantity"
              name="quantity"
              defaultValue={quantity}
              type="number"
              required
            />
            <div className="grow">
              <label className="block">&nbsp;</label>
              <div className="mt-1 block w-full px-3 py-2">
                /{" "}
                {filteredItems.length === 1
                  ? filteredItems[0].quantityLeft +
                    (allocation &&
                    (allocation.itemId ?? -1) === filteredItems[0].id
                      ? allocation?.quantity
                      : 0)
                  : "XX"}{" "}
                {/* Displays the quantity left when there is a guaranteed item to choose from */}
              </div>
            </div>
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
              Confirm for Partner&apos;s Distribution
            </button>
          </ModalFormRow>
        </form>
      </div>
    </div>
  );
}

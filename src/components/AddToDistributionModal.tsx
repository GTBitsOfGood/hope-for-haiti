import { X, Check } from "@phosphor-icons/react";
import { z } from "zod";
import ModalTextField from "./ModalTextField";
import ModalFormRow from "./ModalFormRow";
import { useState } from "react";
import { CgSpinner } from "react-icons/cg";

interface AddToDistributionModalProps {
  maxQuantity: number;
  unitType: string;
  onSubmit: (quantity: number, visible: boolean) => Promise<boolean>;
  onClose: (success: boolean) => void;
  partnerName: string;
}

const AddToDistributionSchema = z.object({
  quantity: z.coerce.number().min(1),
});

export default function AddToDistributionModal({
  maxQuantity,
  unitType,
  onSubmit,
  onClose,
  partnerName,
}: AddToDistributionModalProps) {
  const [visible, setVisible] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validatedForm = AddToDistributionSchema.safeParse({ quantity });
    if (validatedForm.success && validatedForm.data.quantity <= maxQuantity) {
      const success = await onSubmit(validatedForm.data.quantity, visible);
      setIsSuccess(success);
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    onClose(isSuccess);
    setQuantity("");
    setVisible(false);
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
        <div className="flex flex-col bg-white p-8 rounded-lg shadow-lg w-[600px] relative">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">
              Item added to Pending Distribution
            </h2>
            <X onClick={handleClose} size={24} className="cursor-pointer" />
          </div>
          <div className="flex justify-center items-center mb-6">
            <div className="bg-blue-primary rounded-full p-4">
              <Check size={64} weight="bold" className="text-white" />
            </div>
          </div>
          <div className="text-center mb-6">
            <p className="text-lg text-gray-500">
              {partnerName}&apos;s pending distribution has been updated with
              this item.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-25"
            onClick={handleClose}
          />
          <div className="relative w-[700px]Z transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Add Item</h2>
              <X onClick={handleClose} size={24} className="cursor-pointer" />
            </div>
            <form className="flex flex-col gap-y-4" onSubmit={handleSubmit}>
              <ModalFormRow>
                <div className="flex items-center gap-x-2">
                  <ModalTextField
                    label="Quantity to allocate"
                    name="quantity"
                    required
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  <span className="text-gray-500 mt-6">/ {maxQuantity}</span>
                </div>
              </ModalFormRow>
              <ModalFormRow>
                <div className="flex items-center">
                  <span>Unit Type:</span>
                  <span className="ml-2">{unitType}</span>
                </div>
              </ModalFormRow>
              <ModalFormRow>
                <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-x-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={(e) => setVisible(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <div>
                    <div className="font-medium">
                      Make Item Visible in Partner&apos;s Distribution?
                    </div>
                    <div className="text-gray-600 text-sm">
                      Once visible, partners can see this item on their My
                      Distribution page.
                    </div>
                  </div>
                </div>
              </ModalFormRow>
              <ModalFormRow>
                <div className="flex w-full gap-x-4">
                  <button
                    type="button"
                    className="w-1/2 border border-red-500 text-center text-red-500 bg-white py-1 px-4 rounded-lg font-medium hover:bg-red-50 transition"
                    onClick={handleClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-1/2 bg-red-500 text-center text-white py-1 px-4 rounded-lg font-medium hover:bg-red-600 transition"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <CgSpinner className="animate-spin opacity-50" />
                        <span className="ml-2">Adding...</span>
                      </div>
                    ) : (
                      "Add item"
                    )}
                  </button>
                </div>
              </ModalFormRow>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

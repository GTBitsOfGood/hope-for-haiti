import { useState } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import toast from "react-hot-toast"
interface EditHfhShippingNumberModalProps {
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void; 
  shipmentId: number; 
  currentHfhShippingNumber: string; 
}

export default function EditHfhShippingNumberModal({
  isOpen, 
  onClose, 
  onSuccess,
  shipmentId, 
  currentHfhShippingNumber,
}: EditHfhShippingNumberModalProps) {
  const { apiClient } = useApiClient(); 
  const [hfhShippingNumber, setHfhShippingNumber] = useState(currentHfhShippingNumber);
  const [isSubmitting, setIsSubmitting] = useState(false) 

  const handleSave = async () => {
    setIsSubmitting(true); 
    try {
      const url = new URLSearchParams({ id: shipmentId.toString() });
      const promise = apiClient.patch(`/api/shipments?${url}`, {
        body: JSON.stringify({ hfhShippingNumber }),
      });

      toast.promise(promise, {
        loading: "Updating HFH Shipping Number...",
        success: "HFH Shipping Number Updated",
        error: "Error Updating HFH Shipping Number", 
      });

      await promise; 
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to update HFH Shipping #: ", error); 
    } finally {
      setIsSubmitting(false); 
    }
  };

  if (!isOpen) return null; 

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-lg text-[#22070B]">
        <h2 className="text-[20px] font-semibold leading-[28px] mb-4">
          Edit HFH Shipping #
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            HFH Shipping Number
          </label>
          <input
            type="text"
            value={hfhShippingNumber}
            onChange={(e) => setHfhShippingNumber(e.target.value)}
            className="w-full rounded-[4px] border border-gray-300 text-[16px] p-3"
            placeholder="Enter HFH Shipping #"
          />
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="bg-white hover:bg-gray-100 text-[#EF3340] border-2 border-[#EF3340] font-semibold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-[#EF3340] hover:bg-[#a32027] text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
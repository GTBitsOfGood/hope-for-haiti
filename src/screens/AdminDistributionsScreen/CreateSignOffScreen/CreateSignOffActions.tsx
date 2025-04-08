import { Dispatch, SetStateAction } from "react";
import { CreateSignOffStep } from ".";

interface CreateSignOffActionsProps {
  step: CreateSignOffStep;
  setStep: Dispatch<SetStateAction<CreateSignOffStep>>;
}
export default function CreateSignOffActions({
  step,
  setStep,
}: CreateSignOffActionsProps) {
  const handleCancel = () => {
    if (step === "create") {
    }
    if (step === "confirm") {
      setStep("create");
    }
    if (step === "final") {
    }
  };

  const handleSave = () => {
    if (step === "final") {
    }
  };

  const handleConfirm = () => {
    if (step === "create") {
      setStep("confirm");
    }
    if (step === "confirm") {
      setStep("final");
    }
    if (step === "final") {
    }
  };
  return (
    <div className="flex w-full justify-between">
      <div className="flex gap-2">
        <button
          type="button"
          className="w-60 border border-red-500 text-center text-red-500 bg-white py-1 px-4 rounded-lg font-medium hover:bg-red-50 transition"
          onClick={handleCancel}
        >
          {step === "create" && "Cancel Sign Off"}
          {step === "confirm" && "Back"}
          {step === "final" && "Cancel"}
        </button>
        {step === "final" && (
          <button
            type="button"
            className="w-60 border border-red-500 text-center text-red-500 bg-white py-1 px-4 rounded-lg font-medium hover:bg-red-50 transition"
            onClick={handleSave}
          >
            Save for Later
          </button>
        )}
      </div>
      <button
        type="submit"
        className="w-60 bg-red-500 text-center text-white py-1 px-4 rounded-lg font-medium hover:bg-red-600 transition"
        onClick={handleConfirm}
      >
        {step === "create" && "Confirm Selection"}
        {step === "confirm" && "Confirm"}
        {step === "final" && "Sign Off"}
      </button>
    </div>
  );
}

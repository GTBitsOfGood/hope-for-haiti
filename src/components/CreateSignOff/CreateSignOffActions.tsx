import { Dispatch, SetStateAction } from "react";
import toast from "react-hot-toast";

export type CreateSignOffStep = "create" | "confirm" | "final";

interface CreateSignOffActionsProps {
  step: CreateSignOffStep;
  setStep: Dispatch<SetStateAction<CreateSignOffStep>>;
  hasSelections: boolean;
  onSubmit: () => void;
}
export default function CreateSignOffActions({
  step,
  setStep,
  hasSelections,
  onSubmit,
}: CreateSignOffActionsProps) {
  const handleCancel = () => {
    if (step === "create") {
    }
    if (step === "confirm") {
      setStep("create");
    }
    if (step === "final") {
      setStep("confirm");
    }
  };

  // const handleSave = () => {
  //   if (step === "final") {
  //   }
  // };

  const handleConfirm = () => {
    if (step === "create") {
      if (hasSelections) {
        setStep("confirm");
      } else {
        toast.error("Must select at least one allocation before continuing");
      }
    }
    if (step === "confirm") {
      setStep("final");
    }
    if (step === "final") {
      onSubmit();
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
          {step === "final" && "Back"}
        </button>
        {/* {step === "final" && (
          <button
            type="button"
            className="w-60 border border-red-500 text-center text-red-500 bg-white py-1 px-4 rounded-lg font-medium hover:bg-red-50 transition"
            onClick={handleSave}
          >
            Save for Later
          </button>
        )} */}
      </div>
      <button
        type="submit"
        className="w-60 bg-red-500 text-center text-white py-1 px-4 rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-30"
        onClick={handleConfirm}
        disabled={!hasSelections}
      >
        {step === "create" && "Confirm Selection"}
        {step === "confirm" && "Confirm"}
        {step === "final" && "Sign Off"}
      </button>
    </div>
  );
}

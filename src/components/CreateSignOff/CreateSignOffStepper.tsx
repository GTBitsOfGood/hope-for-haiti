import { Check } from "@phosphor-icons/react";
import { CreateSignOffStep } from "./CreateSignOffActions";
import { cn } from "@/util/util";

interface CreateSignOffStepperProps {
  step: CreateSignOffStep;
}

export default function CreateSignOffStepper({
  step,
}: CreateSignOffStepperProps) {
  return (
    <div className="flex items-center mx-auto">
      <div className="bg-red-500 rounded-full size-6 flex items-center justify-center text-white">
        {step === "create" ? "1" : <Check weight="bold" />}
      </div>
      <hr
        className={cn(
          "w-20 h-[2px] bg-red-500",
          step === "create" && "opacity-40"
        )}
      />
      <div
        className={cn(
          "bg-red-500 rounded-full size-6 flex items-center justify-center text-white",
          step === "create" && "opacity-40"
        )}
      >
        {step === "confirm" ? "2" : <Check weight="bold" />}
      </div>
      <hr
        className={cn(
          "w-20 h-[2px] bg-red-500",
          step !== "final" && "opacity-40"
        )}
      />
      <div
        className={cn(
          "bg-red-500 rounded-full size-6 flex items-center justify-center text-white",
          step !== "final" && "opacity-40"
        )}
      >
        {step === "final" ? "3" : <Check weight="bold" />}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import ConfirmQuantity from "./ConfirmQuantity";
import CreateSignOff from "./CreateSignOff";
import CreateSignOffActions from "./CreateSignOffActions";
import CreateSignOffStepper from "./CreateSignOffStepper";
import FinalSignOff from "./FinalSignOff";

export type CreateSignOffStep = "create" | "confirm" | "final";

export default function CreateSignOffScreen() {
  // const { partnerId } = useParams();

  const [step, setStep] = useState<CreateSignOffStep>("create");

  return (
    <div className="flex flex-col gap-8">
      <CreateSignOffStepper step={step} />
      {step === "create" && <CreateSignOff />}
      {step === "confirm" && <ConfirmQuantity />}
      {step === "final" && <FinalSignOff />}
      <CreateSignOffActions step={step} setStep={setStep} />
    </div>
  );
}

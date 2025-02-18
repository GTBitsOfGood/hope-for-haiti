"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StepOne from "./CreatePartnerAccount/StepOne";
import StepTwo from "./CreatePartnerAccount/StepTwo";
import StepThree from "./CreatePartnerAccount/StepThree";
import StepFour from "./CreatePartnerAccount/StepFour";
import StepFive from "./CreatePartnerAccount/StepFive";
import StepSix from "./CreatePartnerAccount/StepSix";
import StepSeven from "./CreatePartnerAccount/StepSeven";
import StepEight from "./CreatePartnerAccount/StepEight";
import StepNine from "./CreatePartnerAccount/StepNine";
import StepTen from "./CreatePartnerAccount/StepTen";

export default function CreatePartnerAccountScreen() {
  const [step, setStep] = useState(1);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  //get name & email from URL params from InviteUserForm
  const [name] = useState(searchParams.get("name") || "");
  const [email] = useState(searchParams.get("email") || "");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const nextStep = async () => {
    if (step === 10) {
      setSendingInvite(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/invites", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            email,
            name,
            userType: "PARTNER",
          }).toString(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", errorText);
          throw new Error(errorText || "Failed to send invite.");
        }

        //go back to account management after
        router.push("/account_management");
      } catch (error) {
        setErrorMessage("Failed to send invite. Please try again.");
      } finally {
        setSendingInvite(false);
      }
    } else {
      setStep((prev) => Math.min(prev + 1, 10));
    }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));
  const handleCancelClick = () => setShowConfirmCancel(true);
  const confirmCancel = () => {
    setShowConfirmCancel(false);
    router.push("/account_management");
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="max-w-3xl mx-auto py-8 px-6">
        <div className="flex items-center justify-between mb-10 w-[140%] -ml-[15%]">
          {[...Array(10)].map((_, i) => {
            const index = i + 1;
            const isActive = index <= step;
            const isCompleted = index < step;

            return (
              <div key={index} className="flex items-center w-full">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium relative"
                  style={{
                    backgroundColor: isActive ? "rgba(239, 51, 64, 1)" : "rgba(239, 51, 64, 0.2)",
                    border: "2px solid rgba(239, 51, 64, 0.2)",
                    color: "#FFF",
                  }}
                >
                  {isCompleted ? (
                    <img src="/assets/progress_checkmark.svg" alt="Checkmark" className="w-4 h-4" />
                  ) : (
                    index
                  )}
                </div>
                {index < 10 && (
                  <div
                    className="flex-1 h-[2px]"
                    style={{
                      backgroundColor: isCompleted ? "rgba(239, 51, 64, 0.8)" : "rgba(239, 51, 64, 0.2)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Steps */}
        {step === 1 && <StepOne nextStep={nextStep} handleCancelClick={handleCancelClick} />}
        {step === 2 && <StepTwo prevStep={prevStep} nextStep={nextStep} handleCancelClick={handleCancelClick} />}
        {step === 3 && <StepThree prevStep={prevStep} nextStep={nextStep} handleCancelClick={handleCancelClick} />}
        {step === 4 && <StepFour prevStep={prevStep} nextStep={nextStep} handleCancelClick={handleCancelClick} />}
        {step === 5 && <StepFive prevStep={prevStep} nextStep={nextStep} handleCancelClick={handleCancelClick} />}
        {step === 6 && <StepSix prevStep={prevStep} nextStep={nextStep} handleCancelClick={handleCancelClick} />}
        {step === 7 && <StepSeven prevStep={prevStep} nextStep={nextStep} handleCancelClick={handleCancelClick} />}
        {step === 8 && <StepEight prevStep={prevStep} nextStep={nextStep} handleCancelClick={handleCancelClick} />}
        {step === 9 && <StepNine prevStep={prevStep} nextStep={nextStep} handleCancelClick={handleCancelClick} />}
        {step === 10 && <StepTen prevStep={prevStep} nextStep={nextStep} handleCancelClick={handleCancelClick} />}

        {sendingInvite && <p className="text-red-500 text-sm mt-2">Sending invite...</p>}
        {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}

        {showConfirmCancel && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
              <h2 className="text-xl font-bold mb-4">Cancel Account Creation</h2>
              <p className="mb-4">Are you sure you want to cancel creating this partner account?</p>
              <div className="flex justify-between">
                <button className="border border-gray-500 px-4 py-2 rounded-lg" onClick={() => setShowConfirmCancel(false)}>
                  No, go back
                </button>
                <button className="bg-mainRed text-white px-4 py-2 rounded-lg" onClick={confirmCancel}>
                  Yes, cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

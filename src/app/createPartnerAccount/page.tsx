"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CreatePartnerStep from "@/components/PartnerDetails/CreatePartnerStep";
import { validatePartnerStep } from "@/components/PartnerDetails/validation";
import {
  partnerDetails1,
  partnerDetails2,
  partnerDetails3,
  partnerDetails4,
  partnerDetails5,
  partnerDetails6,
  partnerDetails7,
  partnerDetails8,
  partnerDetails9,
  partnerDetails10,
  PartnerDetails,
} from "@/schema/partnerDetails";

export default function CreatePartnerAccountPage() {
  const schemas = [
    partnerDetails1,
    partnerDetails2,
    partnerDetails3,
    partnerDetails4,
    partnerDetails5,
    partnerDetails6,
    partnerDetails7,
    partnerDetails8,
    partnerDetails9,
    partnerDetails10,
  ];

  const [step, setStep] = useState(1);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [partnerDetails, setPartnerDetails] = useState<Partial<PartnerDetails>>(
    {}
  );
  // const [msspRegistration, setMsspRegistration] = useState<File | null>(null);

  const router = useRouter();

  const handleFileChange = (name: string, file: File | null) => {
    if (name === "proofOfRegistrationWithMssp") {
      // setMsspRegistration(file);
      setPartnerDetails((prev) => ({
        ...prev,
        [name]: file?.name || undefined,
      }));
    }

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDataChange = (data: Partial<PartnerDetails>) => {
    setPartnerDetails(data);
    setFieldErrors({});
    setErrorMessage("");
  };

  const nextStep = async () => {
    if (step === 10) {
      const currentSchema = schemas[step - 1];
      const parsed = currentSchema.safeParse(partnerDetails);
      if (parsed.error) {
        setErrorMessage(parsed.error.message);
        return;
      }
      if (parsed.success) {
        setErrorMessage("");
      }
    } else {
      const validationErrors = validatePartnerStep(step, partnerDetails);

      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        setErrorMessage(
          "Please fill out all required fields before proceeding."
        );
        return;
      }

      const currentSchema = schemas[step - 1];
      const parsed = currentSchema.safeParse(partnerDetails);
      if (parsed.error) {
        setErrorMessage(parsed.error.message);
        return;
      }

      setFieldErrors({});
      setErrorMessage("");
      setStep((prev) => Math.min(prev + 1, 10));
    }
  };

  const prevStep = () => {
    setFieldErrors({});
    setErrorMessage("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCancelClick = () => setShowConfirmCancel(true);
  const confirmCancel = () => {
    setShowConfirmCancel(false);
    router.push("/accountManagement");
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="max-w-3xl mx-auto py-8 px-6">
        {step === 1 && (
          <h2 className="text-[24px] font-bold text-[#22070B] mb-6">
            Create partner account
          </h2>
        )}

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
                    backgroundColor: isActive
                      ? "rgba(239, 51, 64, 1)"
                      : "rgba(239, 51, 64, 0.2)",
                    border: "2px solid rgba(239, 51, 64, 0.2)",
                    color: "#FFF",
                  }}
                >
                  {isCompleted ? (
                    <Image
                      src="/assets/progress_checkmark.svg"
                      alt="Checkmark"
                      width={16}
                      height={16}
                    />
                  ) : (
                    index
                  )}
                </div>
                {index < 10 && (
                  <div
                    className="flex-1 h-[2px]"
                    style={{
                      backgroundColor: isCompleted
                        ? "rgba(239, 51, 64, 0.8)"
                        : "rgba(239, 51, 64, 0.2)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <CreatePartnerStep
          step={step}
          partnerDetails={partnerDetails}
          onDataChange={handleDataChange}
          onFileChange={handleFileChange}
          errors={fieldErrors}
          onNext={nextStep}
          onPrev={prevStep}
          onCancel={handleCancelClick}
          isFirstStep={step === 1}
          isLastStep={step === 10}
        />

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{errorMessage}</p>
          </div>
        )}

        {showConfirmCancel && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
              <h2 className="text-xl font-bold mb-4">
                Cancel Account Creation
              </h2>
              <p className="mb-4">
                Are you sure you want to cancel creating this partner account?
              </p>
              <div className="flex justify-between">
                <button
                  className="border border-gray-500 px-4 py-2 rounded-lg"
                  onClick={() => setShowConfirmCancel(false)}
                >
                  No, go back
                </button>
                <button
                  className="bg-mainRed text-white px-4 py-2 rounded-lg"
                  onClick={confirmCancel}
                >
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

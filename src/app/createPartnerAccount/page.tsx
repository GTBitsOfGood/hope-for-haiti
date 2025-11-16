"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import CreatePartnerStep from "@/components/PartnerDetails/CreatePartnerStep";
import { validatePartnerStep } from "@/components/PartnerDetails/validation";
import { PartnerDetails } from "@/schema/partnerDetails";
import { useFetch } from "@/hooks/useFetch";

export default function CreatePartnerAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const isEditMode = !!userId;

  const [step, setStep] = useState(1);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [partnerDetails, setPartnerDetails] = useState<Partial<PartnerDetails>>(
    {}
  );
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  // const [msspRegistration, setMsspRegistration] = useState<File | null>(null);

  // Fetch existing partner details if editing
  const { data: existingPartnerDetails, isLoading: isLoadingDetails } =
    useFetch<PartnerDetails>(userId ? `/api/partnerDetails/${userId}` : "", {
      conditionalFetch: !!userId,
      onError: (error) => {
        console.error("Failed to load partner details:", error);
        setCreateError("Failed to load partner details. Please try again.");
      },
    });

  // Populate form with existing data when editing
  useEffect(() => {
    if (isEditMode && existingPartnerDetails) {
      setPartnerDetails(existingPartnerDetails);
    }
  }, [isEditMode, existingPartnerDetails]);

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
    setCreateError("");
  };

  const nextStep = async () => {
    const validationErrors = validatePartnerStep(step, partnerDetails);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    if (step === 10) {
      await createAccount();
      return;
    }

    setFieldErrors({});
    setStep((prev) => Math.min(prev + 1, 10));
  };

  const createAccount = async () => {
    if (isEditMode) {
      await updateAccount();
      return;
    }

    const name = searchParams.get("name");
    const email = searchParams.get("email");

    if (!name || !email) {
      setCreateError(
        "Name and email are required. Please go back to account management and start again."
      );
      return;
    }

    setIsCreating(true);
    setCreateError("");

    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          userType: "PARTNER",
          partnerDetails: JSON.stringify(partnerDetails),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            "Failed to create partner account. Please try again."
        );
      }

      router.push("/accountManagement");
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Failed to create partner account. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const updateAccount = async () => {
    if (!userId) return;

    setIsCreating(true);
    setCreateError("");

    try {
      const formData = new FormData();
      formData.append("partnerDetails", JSON.stringify(partnerDetails));

      const response = await fetch(`/api/partnerDetails/${userId}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            "Failed to update partner account. Please try again."
        );
      }

      router.push("/accountManagement");
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Failed to update partner account. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const prevStep = () => {
    setFieldErrors({});
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
            {isEditMode ? "Edit partner account" : "Create partner account"}
          </h2>
        )}

        {isLoadingDetails && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-600 text-sm">Loading partner details...</p>
          </div>
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
          isCreating={isCreating}
          isEditMode={isEditMode}
        />

        {createError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{createError}</p>
          </div>
        )}

        {isCreating && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-600 text-sm">
              {isEditMode
                ? "Updating partner account..."
                : "Creating partner account..."}
            </p>
          </div>
        )}

        {showConfirmCancel && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
              <h2 className="text-xl font-bold mb-4">
                Cancel {isEditMode ? "Editing" : "Account Creation"}
              </h2>
              <p className="mb-4">
                Are you sure you want to cancel{" "}
                {isEditMode ? "editing" : "creating"} this partner account?
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

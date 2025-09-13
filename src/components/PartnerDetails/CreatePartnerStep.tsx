import React, { useState, useEffect } from "react";
import { PartnerDetails } from "@/schema/partnerDetails";
import FieldRenderer, { FieldValue } from "./FieldRenderer";
import { stepFieldConfigs } from "./fieldConfigs";
import { getNestedValue, setNestedValue } from "./validation";

interface CreatePartnerStepProps {
  step: number;
  partnerDetails: Partial<PartnerDetails>;
  onDataChange: (data: Partial<PartnerDetails>) => void;
  onFileChange?: (name: string, file: File | null) => void;
  errors?: Record<string, string>;
  onNext: () => void;
  onPrev: () => void;
  onCancel: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const stepTitles: Record<number, string> = {
  1: "General information",
  2: "Contact information",
  3: "Introduction",
  4: "Facility information",
  5: "Infrastructure & Services",
  6: "Programs & Services Provided",
  7: "Finances",
  8: "Patient Demographics",
  9: "Staff Information",
  10: "Medical Supplies",
};

export default function CreatePartnerStep({
  step,
  partnerDetails,
  onDataChange,
  onFileChange,
  errors = {},
  onNext,
  onPrev,
  onCancel,
  isFirstStep,
  isLastStep,
}: CreatePartnerStepProps) {
  const stepFields = stepFieldConfigs[step] || [];
  const [formData, setFormData] =
    useState<Partial<PartnerDetails>>(partnerDetails);

  useEffect(() => {
    setFormData(partnerDetails);
  }, [partnerDetails]);

  const handleFieldChange = (name: string, value: FieldValue) => {
    const updatedData = setNestedValue({ ...formData }, name, value);
    setFormData(updatedData);
    onDataChange(updatedData);
  };

  return (
    <div>
      <h3 className="text-[18px] font-bold text-[#22070B]/70 mb-6">
        {stepTitles[step]}
      </h3>

      <div className="space-y-6">
        {stepFields.map((fieldConfig) => (
          <FieldRenderer
            key={fieldConfig.name}
            config={fieldConfig}
            value={getNestedValue(formData, fieldConfig.name) as FieldValue}
            onChange={handleFieldChange}
            onFileChange={onFileChange}
            isEditing={true}
            errors={errors}
            allValues={formData as Record<string, FieldValue>}
          />
        ))}
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t">
        <button
          className="text-mainRed font-semibold hover:text-mainRed/80"
          onClick={onCancel}
          type="button"
        >
          Cancel account creation
        </button>
        <div className="flex gap-4">
          {!isFirstStep && (
            <button
              className="border border-mainRed text-mainRed px-6 py-3 rounded-[4px] font-semibold hover:bg-mainRed/10"
              onClick={onPrev}
              type="button"
            >
              Previous
            </button>
          )}
          <button
            className="bg-mainRed text-white px-6 py-3 rounded-[4px] font-semibold hover:bg-mainRed/90"
            onClick={onNext}
            type="button"
          >
            {isLastStep ? "Create Account" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { PartnerDetails } from "@/schema/partnerDetails";
import FieldRenderer, { FieldValue } from "./FieldRenderer";
import { fieldConfigs } from "./fieldConfigs";
import { getNestedValue, setNestedValue } from "./validation";

interface PartnerDetailsSectionProps {
  sectionName: string;
  partnerDetails: Partial<PartnerDetails>;
  onSave?: (updatedDetails: Partial<PartnerDetails>) => Promise<void>;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  isSaving: boolean;
  mode: "view" | "edit" | "create";
  onDataChange?: (data: Partial<PartnerDetails>) => void;
  errors?: Record<string, string>;
  onFileChange?: (name: string, file: File | null) => void;
}

export default function PartnerDetailsSection({
  sectionName,
  partnerDetails,
  onSave,
  isEditing,
  setIsEditing,
  isSaving,
  mode,
  onDataChange,
  errors = {},
  onFileChange,
}: PartnerDetailsSectionProps) {
  const sectionFields = fieldConfigs[sectionName] || [];
  const [formData, setFormData] =
    useState<Partial<PartnerDetails>>(partnerDetails);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    setFormData(partnerDetails);
  }, [partnerDetails]);

  const handleFieldChange = (name: string, value: FieldValue) => {
    let updatedData = setNestedValue({ ...formData }, name, value);

    if (name === "registeredWithMssp" && value === false) {
      updatedData = setNestedValue(
        updatedData,
        "proofOfRegistrationWithMssp",
        ""
      );
    }

    setFormData(updatedData);

    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name === "registeredWithMssp" && value === false) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors["proofOfRegistrationWithMssp"];
        return newErrors;
      });
    }

    if (mode === "create" && onDataChange) {
      onDataChange(updatedData);
    }
  };

  const handleFileChangeInternal = (name: string, file: File | null) => {
    if (file) {
      const updatedData = setNestedValue({ ...formData }, name, file.name);
      setFormData(updatedData);

      if (validationErrors[name]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    } else {
      const updatedData = setNestedValue({ ...formData }, name, "");
      setFormData(updatedData);
    }

    if (onFileChange) {
      onFileChange(name, file);
    }
  };

  const handleSave = async () => {
    if (mode === "edit" || (mode === "view" && isEditing)) {
      const sectionValidationErrors: Record<string, string> = {};

      sectionFields.forEach((field) => {
        if (field.required) {
          const value = getNestedValue(formData, field.name);

          let isEmpty = false;

          if (field.type === "multiselect") {
            isEmpty = !Array.isArray(value) || value.length === 0;
          } else if (field.type === "boolean") {
            isEmpty = value === undefined || value === null;
          } else {
            isEmpty =
              !value || (typeof value === "string" && value.trim() === "");
          }

          if (isEmpty) {
            sectionValidationErrors[field.name] = `${field.label} is required`;
          }
        }
      });

      if (sectionName === "Introduction") {
        const registeredWithMssp = getNestedValue(
          formData,
          "registeredWithMssp"
        );
        const proofOfRegistration = getNestedValue(
          formData,
          "proofOfRegistrationWithMssp"
        );

        if (registeredWithMssp === true) {
          if (
            !proofOfRegistration ||
            (typeof proofOfRegistration === "string" &&
              proofOfRegistration.trim() === "")
          ) {
            sectionValidationErrors["proofOfRegistrationWithMssp"] =
              "Proof of registration with MSSP is required when registered with MSSP";
          }
        }
      }

      if (Object.keys(sectionValidationErrors).length > 0) {
        setValidationErrors(sectionValidationErrors);
        return;
      }
    }

    if (onSave) {
      await onSave(formData);
      setValidationErrors({});
    }
  };

  const handleCancel = () => {
    setFormData(partnerDetails);
    setValidationErrors({});
    setIsEditing(false);
  };

  const canEdit = mode !== "view" || isEditing;
  const showEditControls = mode === "edit" || mode === "view";
  const allErrors = { ...errors, ...validationErrors };

  return (
    <div className="mt-6">
      {showEditControls && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[20px] font-bold text-[#2774AE]">
            {sectionName}
          </h3>
          <div className="flex gap-2">
            {isEditing && (
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="border border-gray-400 text-gray-600 px-4 py-2 rounded-[4px] font-semibold hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              disabled={isSaving}
              className="border border-mainRed text-mainRed px-4 py-2 rounded-[4px] font-semibold hover:bg-mainRed/10 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : isEditing ? "Save" : "Edit"}
            </button>
          </div>
        </div>
      )}

      {mode === "create" && (
        <div className="mb-6">
          <h3 className="text-[18px] font-bold text-[#22070B]/70">
            {sectionName}
          </h3>
        </div>
      )}

      {Object.keys(validationErrors).length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">
            Please fill out all required fields before saving.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {sectionFields.map((fieldConfig) => (
          <div key={fieldConfig.name} className="mb-4">
            <div
              className={
                mode === "create"
                  ? "space-y-2"
                  : "grid grid-cols-2 gap-4 items-start"
              }
            >
              <div>
                <p className="text-[18px] font-semibold text-[#22070B]">
                  {fieldConfig.label}
                  {(() => {
                    const isRequired = fieldConfig.required || false;
                    const isDynamicallyRequired =
                      fieldConfig.conditionalField &&
                      fieldConfig.conditionalValue !== undefined &&
                      getNestedValue(formData, fieldConfig.conditionalField) ===
                        fieldConfig.conditionalValue;
                    return (
                      (isRequired || isDynamicallyRequired) && (
                        <span className="text-red-500 ml-1">*</span>
                      )
                    );
                  })()}
                </p>
                {fieldConfig.description && (
                  <p className="text-[14px] text-[#22070B]/70 mt-1">
                    {fieldConfig.description}
                  </p>
                )}
              </div>
              <div>
                <FieldRenderer
                  config={fieldConfig}
                  value={
                    getNestedValue(formData, fieldConfig.name) as FieldValue
                  }
                  onChange={handleFieldChange}
                  onFileChange={handleFileChangeInternal}
                  isEditing={canEdit}
                  errors={allErrors}
                  allValues={formData as Record<string, FieldValue>}
                  renderLayoutWrapper={false}
                />
                {allErrors?.[fieldConfig.name] && (
                  <p className="text-red-500 text-sm mt-1">
                    {allErrors[fieldConfig.name]}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {mode === "create" && (
        <div className="flex justify-between mt-8">
          <button
            className="text-mainRed font-semibold"
            onClick={() => {
              console.log("Cancel creation");
            }}
            type="button"
          >
            Cancel account creation
          </button>
          <div className="flex gap-4">
            <button
              className="border border-mainRed text-mainRed px-6 py-3 rounded-[4px] font-semibold"
              onClick={() => {
                console.log("Previous step");
              }}
              type="button"
            >
              Previous
            </button>
            <button
              className="bg-mainRed text-white px-6 py-3 rounded-[4px] font-semibold"
              onClick={() => {
                console.log("Next step");
              }}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

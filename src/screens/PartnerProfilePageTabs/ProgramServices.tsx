"use client";

import React, { useState } from "react";
import { PartnerDetails } from "@/schema/partnerDetails";

interface ProgramServicesProps {
  isEditingOrg: boolean;
  setIsEditingOrg: React.Dispatch<React.SetStateAction<boolean>>;
  partnerDetails: PartnerDetails;
  onSave: (updatedDetails: Partial<PartnerDetails>) => Promise<void>;
  isSaving: boolean;
}

export default function ProgramServices({
  isEditingOrg,
  setIsEditingOrg,
  partnerDetails,
  onSave,
  isSaving,
}: ProgramServicesProps) {
  const [formData, setFormData] = useState({
    medicalServicesProvided: partnerDetails.medicalServicesProvided,
    otherMedicalServicesProvided: partnerDetails.otherMedicalServicesProvided,
  });

  const handleSave = async () => {
    await onSave(formData);
  };

  const handleCancel = () => {
    setFormData({
      medicalServicesProvided: partnerDetails.medicalServicesProvided,
      otherMedicalServicesProvided: partnerDetails.otherMedicalServicesProvided,
    });
    setIsEditingOrg(false);
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-bold text-[#2774AE]">
          Programs & Services Provided
        </h3>
        <div className="flex gap-2">
          {isEditingOrg && (
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="border border-gray-400 text-gray-600 px-4 py-2 rounded-[4px] font-semibold hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={isEditingOrg ? handleSave : () => setIsEditingOrg(true)}
            disabled={isSaving}
            className="border border-mainRed text-mainRed px-4 py-2 rounded-[4px] font-semibold hover:bg-mainRed/10 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : isEditingOrg ? "Save" : "Edit"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 max-w-xl">
        <p className="text-[18px] font-semibold text-[#22070B]">
          Medical Services Provided
        </p>
        {isEditingOrg ? (
          <textarea
            value={formData.medicalServicesProvided.join(", ")}
            onChange={(e) =>
              setFormData({
                ...formData,
                medicalServicesProvided: e.target.value
                  .split(", ")
                  .filter((s) => s.trim()) as (
                  | "cancer"
                  | "dentistry"
                  | "dermatology"
                  | "hematology"
                  | "immunizations"
                  | "parasitic_infections"
                  | "acute_respiratory_infections"
                  | "vector_borne_diseases"
                  | "chronic_diseases"
                  | "diarrheal_diseases"
                  | "vaccine_preventable_diseases"
                  | "infectious_diseases"
                  | "neurology"
                  | "malnutrition"
                  | "ophthalmology"
                  | "ears_nose_throat"
                  | "orthopedics_and_rehabilitation"
                  | "pediatrics"
                  | "radiology"
                  | "wound_care"
                  | "maternal_care"
                  | "lab_tests"
                  | "trauma_and_surgery"
                  | "urology"
                )[],
              })
            }
            className="border p-1 min-h-[100px]"
            placeholder="Enter services separated by commas"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.medicalServicesProvided.join(", ") ||
              "None specified"}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Other Medical Services
        </p>
        {isEditingOrg ? (
          <textarea
            value={formData.otherMedicalServicesProvided}
            onChange={(e) =>
              setFormData({
                ...formData,
                otherMedicalServicesProvided: e.target.value,
              })
            }
            className="border p-1 min-h-[100px]"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.otherMedicalServicesProvided || "None specified"}
          </p>
        )}
      </div>
    </div>
  );
}

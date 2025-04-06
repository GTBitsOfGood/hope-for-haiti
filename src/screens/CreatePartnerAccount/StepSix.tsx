"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";

interface StepSixProps {
  prevStep: () => void;
  nextStep: () => void;
  handleCancelClick: () => void;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  partnerDetails: { [key: string]: any };
}

export default function StepSix({
  prevStep,
  nextStep,
  handleCancelClick,
  handleInputChange,
  handleCheckboxChange,
  partnerDetails,
}: StepSixProps) {
  return (
    <>
      <h2 className="text-[24px] font-bold text-[#22070B] mb-2 font-[Open_Sans]">
        Create partner account
      </h2>
      <h3 className="text-[18px] font-bold text-[#22070B]/70 mb-5 font-[Open_Sans]">
        Programs & services provided
      </h3>

      <p className="text-[16px] text-[#22070B] mb-2">
        Select all of the medical services your organization provides.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          [
            ["Cancer", "cancer"],
            ["Dentistry", "dentistry"],
            ["Dermatology", "dermatology"],
            ["Hematology", "hematology"],
            ["Immunizations", "immunizations"],
            ["Parasitic infections", "parasitic_infections"],
            ["Acute respiratory infections", "acute_respiratory_infections"],
            ["Vector-borne diseases", "vector_borne_diseases"],
          ],
          [
            ["Chronic diseases", "chronic_diseases"],
            ["Diarrheal diseases", "diarrheal_diseases"],
            ["Vaccine-preventable diseases", "vaccine_preventable_diseases"],
            ["Infectious diseases", "infectious_diseases"],
            ["Neurology", "neurology"],
            ["Malnutrition", "malnutrition"],
            ["Ophthalmology", "ophthalmology"],
            ["Ears-nose-throat", "ears_nose_throat"],
          ],
          [
            [
              "Orthopedics and rehabilitation",
              "orthopedics_and_rehabilitation",
            ],
            ["Pediatrics", "pediatrics"],
            ["Radiology", "radiology"],
            ["Wound care", "wound_care"],
            ["Maternal care", "maternal_care"],
            ["Lab tests", "lab_tests"],
            ["Trauma and surgery", "trauma_and_surgery"],
            ["Urology", "urology"],
          ],
        ].map((column, index) => (
          <div key={index} className="space-y-2">
            {column.map(([label, value]) => (
              <label
                key={value}
                className="flex items-center text-[16px] text-[#22070B]"
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  value={value}
                  onChange={handleCheckboxChange}
                  checked={
                    partnerDetails["medicalServicesProvided"] &&
                    partnerDetails["medicalServicesProvided"].includes(value)
                  }
                  name="medicalServicesProvided"
                />
                {label}
              </label>
            ))}
          </div>
        ))}
      </div>

      <label className="block text-[16px] text-[#22070B] mb-2">
        Please list other services provided not listed above:
      </label>
      <textarea
        className="w-full h-[160px] p-3 border border-[#22070B]/10 bg-[#F9F9F9] 
        text-[16px] text-[#22070B] placeholder:text-[#22070B]/50 
        font-[Open_Sans] rounded-[4px] resize-none mb-8"
        placeholder="List"
        name="otherMedicalServicesProvided"
        value={partnerDetails.otherMedicalServicesProvided || ""}
        onChange={handleInputChange}
      />

      <div className="flex justify-between mt-6">
        <button
          className="text-mainRed font-semibold font-[Open_Sans]"
          onClick={handleCancelClick}
        >
          Cancel account creation
        </button>
        <div>
          <button
            className="border border-mainRed text-mainRed px-6 py-3 rounded-[4px] font-semibold mr-4 font-[Open_Sans]"
            onClick={prevStep}
          >
            Previous
          </button>
          <button
            className="bg-mainRed text-white px-6 py-3 rounded-[4px] font-semibold font-[Open_Sans]"
            onClick={nextStep}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}

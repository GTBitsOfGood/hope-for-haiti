"use client";

import React from "react";

interface StepNineProps {
  prevStep: () => void;
  nextStep: () => void;
  handleCancelClick: () => void;
  partnerDetails: { [key: string]: any };
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function StepNine({
  prevStep,
  nextStep,
  handleCancelClick,
  handleInputChange,
  handleCheckboxChange,
  partnerDetails,
}: StepNineProps) {
  return (
    <>
      <h2 className="text-[24px] font-bold text-[#22070B] mb-2 font-[Open_Sans]">
        Create partner account
      </h2>
      <h3 className="text-[18px] font-bold text-[#22070B]/70 mb-5 font-[Open_Sans]">
        Medical Supplies
      </h3>

      <p className="text-[16px] text-[#22070B] mb-8">
        Please select all categories of medications and medical supplies most
        needed.
      </p>
      <h4 className="font-bold text-[16px] text-[#22070B] mb-2">Medications</h4>
      <div className="grid grid-cols-3 gap-2 mb-8">
        {[
          { label: "Anesthetics", value: "anesthetics" },
          { label: "Antipyretics/NSAIDs", value: "antipyretics_nsaids" },
          { label: "Antiallergics", value: "antiallergics" },
          { label: "Anti-infectives", value: "anti_infectives" },
          { label: "Antineoplastics", value: "antineoplastics" },
          { label: "Cardiovascular", value: "cardiovascular" },
          { label: "Dermatological", value: "dermatological" },
          { label: "Diagnostics", value: "diagnostics" },
          { label: "Diuretics", value: "diuretics" },
          { label: "Gastrointestinal", value: "gastrointestinal" },
          { label: "Ophthalmological", value: "ophthalmological" },
          { label: "Respiratory", value: "respiratory" },
          { label: "Replacements", value: "replacements" },
          { label: "Vitamins/minerals", value: "vitamins_minerals" },
        ].map(({ label, value }) => (
          <label
            key={value}
            className="flex items-center text-[16px] text-[#22070B]"
          >
            <input
              type="checkbox"
              className="mr-2"
              name="mostNeededMedicalSupplies"
              value={value}
              checked={
                partnerDetails.mostNeededMedicalSupplies &&
                partnerDetails.mostNeededMedicalSupplies.includes(value)
              }
              onChange={handleCheckboxChange}
            />
            {label}
          </label>
        ))}
      </div>
      <h4 className="font-bold text-[16px] text-[#22070B] mb-2">
        Medical supplies
      </h4>
      <div className="grid grid-cols-3 gap-2 mb-8">
        {[
          { label: "Bandages", value: "bandages" },
          { label: "Braces", value: "braces" },
          { label: "Hospital Consumables", value: "hospital_consumables" },
          { label: "Dental", value: "dental" },
          { label: "Diagnostic", value: "diagnostic" },
          { label: "Personal Care", value: "personal_care" },
          { label: "Prosthetics", value: "prosthetics" },
          { label: "Respiratory", value: "respiratory " },
          { label: "Surgical", value: "surgical" },
          { label: "Syringes/Needles", value: "syringes_needles" },
        ].map(({ label, value }) => (
          <label
            key={value}
            className="flex items-center text-[16px] text-[#22070B]"
          >
            <input
              type="checkbox"
              className="mr-2"
              value={value}
              name="mostNeededMedicalSupplies"
              checked={
                partnerDetails.mostNeededMedicalSupplies &&
                partnerDetails.mostNeededMedicalSupplies.includes(value)
              }
              onChange={handleCheckboxChange}
            />
            {label}
          </label>
        ))}
      </div>

      <label className="block text-[16px] text-[#22070B] mb-2">
        Please specify other specialty items not listed above
      </label>
      <textarea
        className="w-full h-[160px] p-3 border border-[#22070B]/10 bg-[#F9F9F9] 
        text-[16px] text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] 
        rounded-[4px] resize-none mb-8"
        placeholder="List"
        name="otherSpecialtyItems"
        value={partnerDetails.otherSpecialtyItems || ""}
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
            Send invite link
          </button>
        </div>
      </div>
    </>
  );
}

"use client";

import React from "react";

interface StepNineProps {
  prevStep: () => void;
  nextStep: () => void;
  handleCancelClick: () => void;
}

export default function StepNine({
  prevStep,
  nextStep,
  handleCancelClick,
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
          "Anesthetics",
          "Antipyretics/NSAIDs",
          "Antiallergics",
          "Anti-infectives",
          "Antineoplastics",
          "Cardiovascular",
          "Dermatological",
          "Diagnostics",
          "Diuretics",
          "Gastrointestinal",
          "Ophthalmological",
          "Respiratory",
          "Replacements",
          "Vitamins/minerals",
        ].map((medication) => (
          <label
            key={medication}
            className="flex items-center text-[16px] text-[#22070B]"
          >
            <input type="checkbox" className="mr-2" />
            {medication}
          </label>
        ))}
      </div>
      <h4 className="font-bold text-[16px] text-[#22070B] mb-2">
        Medical supplies
      </h4>
      <div className="grid grid-cols-3 gap-2 mb-8">
        {[
          "Bandages",
          "Braces",
          "Hospital Consumables",
          "Dental",
          "Diagnostic",
          "Personal Care",
          "Prosthetics",
          "Respiratory",
          "Surgical",
          "Syringes/Needles",
        ].map((supply) => (
          <label
            key={supply}
            className="flex items-center text-[16px] text-[#22070B]"
          >
            <input type="checkbox" className="mr-2" />
            {supply}
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

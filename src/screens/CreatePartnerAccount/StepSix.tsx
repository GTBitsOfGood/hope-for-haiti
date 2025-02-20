"use client";

import React from "react";

interface StepSixProps {
  prevStep: () => void;
  nextStep: () => void;
  handleCancelClick: () => void;
}

export default function StepSix({
  prevStep,
  nextStep,
  handleCancelClick,
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
          ["Cancer", "Dentistry", "Dermatology", "Hematology", "Immunizations", "Parasitic infections", "Acute respiratory infections", "Vector-borne diseases"],
          ["Chronic diseases", "Diarrheal diseases", "Vaccine-preventable diseases", "Infectious diseases", "Neurology", "Malnutrition", "Ophthalmology", "Ears-nose-throat"],
          ["Orthopedics and rehabilitation", "Pediatrics", "Radiology", "Wound care", "Maternal care", "Lab tests", "Trauma and surgery", "Urology"],
        ].map((column, index) => (
          <div key={index} className="space-y-2">
            {column.map((service) => (
              <label key={service} className="flex items-center text-[16px] text-[#22070B]">
                <input type="checkbox" className="mr-2" />
                {service}
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
      />

      <div className="flex justify-between mt-6">
        <button className="text-mainRed font-semibold font-[Open_Sans]" onClick={handleCancelClick}>
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

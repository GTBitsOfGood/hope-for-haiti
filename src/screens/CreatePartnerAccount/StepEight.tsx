"use client";

import React from "react";

interface StepEightProps {
  prevStep: () => void;
  nextStep: () => void;
  handleCancelClick: () => void;
}

export default function StepEight({
  prevStep,
  nextStep,
  handleCancelClick,
}: StepEightProps) {
  return (
    <>
      <h2 className="text-[24px] font-bold text-[#22070B] mb-2 font-[Open_Sans]">
        Create partner account
      </h2>
      <h3 className="text-[18px] font-bold text-[#22070B]/70 mb-5 font-[Open_Sans]">
        Staff Information
      </h3>

      {[
        "Number of doctors",
        "Number of nurses",
        "Number of midwives",
        "Number of auxiliaries",
        "Number of statisticians",
        "Number of pharmacists",
        "Number of CHW",
        "Number of administrative",
        "Number of health officers",
        "Total number of staff",
        "Other staff not listed",
      ].map((label, index) => (
        <div key={index} className="mb-5">
          <label className="block text-[16px] text-[#22070B] mb-2">
            {label}
          </label>
          <input
            className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
            text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px]"
            placeholder={label}
          />
        </div>
      ))}

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

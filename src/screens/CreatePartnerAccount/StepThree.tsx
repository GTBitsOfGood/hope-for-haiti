"use client";

import React from "react";

interface StepThreeProps {
  prevStep: () => void;
  nextStep: () => void;
  handleCancelClick: () => void;
}

export default function StepThree({
  prevStep,
  nextStep,
  handleCancelClick,
}: StepThreeProps) {
  return (
    <>
      <h2 className="text-[24px] font-bold text-[#22070B] mb-2 font-[Open_Sans]">
        Create partner account
      </h2>
      <h3 className="text-[18px] font-bold text-[#22070B]/70 mb-4 font-[Open_Sans]">
        Introduction
      </h3>
      <label className="block text-[16px] text-[#22070B] font-[Open_Sans] mb-1">
        Organization history
      </label>
      <textarea
        className="w-full h-36 p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
        text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] 
        border-solid border-[1px] resize-none mb-7"
        placeholder="Organization history"
      />

      <p className="text-[16px] text-[#22070B] font-[Open_Sans] mb-2">
        Type of support requested
      </p>
      <div className="space-y-2 mb-7">
        {[
          "Ongoing support",
          "Mobile clinic support",
          "One-time request",
          "Project support",
        ].map((option) => (
          <label
            key={option}
            className="flex items-center text-[16px] text-[#22070B] font-[Open_Sans]"
          >
            <input type="radio" name="supportType" className="mr-2" />
            {option}
          </label>
        ))}
      </div>

      <label className="block text-[16px] text-[#22070B] font-[Open_Sans] mb-1">
        Date organization was established
      </label>
      <input
        className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
        text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] 
        border-solid border-[1px] mb-7"
        placeholder="00/00/0000"
      />

      <p className="text-[16px] text-[#22070B] font-[Open_Sans] mb-2">
        Is your organization registered with MSSP?
      </p>
      <div className="space-y-2 mb-7">
        <label className="flex items-center text-[16px] text-[#22070B] font-[Open_Sans]">
          <input type="radio" name="msspRegistration" className="mr-2" /> Yes
        </label>

        <div className="ml-6">
          <label className="block text-[16px] text-[#22070B] font-[Open_Sans] mb-1">
            Please provide a copy of the license
          </label>
          <div className="relative w-full">
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
              text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] 
              border-solid border-[1px]"
            >
              Upload File
            </div>
          </div>
        </div>

        <label className="flex items-center text-[16px] text-[#22070B] font-[Open_Sans]">
          <input type="radio" name="msspRegistration" className="mr-2" /> No
        </label>
      </div>

      <label className="block text-[16px] text-[#22070B] font-[Open_Sans] mb-1">
        Program updates since last report
      </label>
      <textarea
        className="w-full h-36 p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
        text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] 
        border-solid border-[1px] resize-none mb-7"
        placeholder="Updates"
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
            className="border border-mainRed text-mainRed px-6 py-3 rounded-[4px] font-semibold font-[Open_Sans] mr-4"
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

"use client";

import React from "react";

interface StepOneProps {
  nextStep: () => void;
  handleCancelClick: () => void;
}

export default function StepOne({ nextStep, handleCancelClick }: StepOneProps) {
  return (
    <>
      <h2 className="text-[24px] font-bold text-[#22070B] mb-2 font-[Open_Sans]">
        Create partner account
      </h2>

      <h3 className="text-[18px] font-bold text-[#22070B]/70 mb-5 font-[Open_Sans]">
        General information
      </h3>

      <div>
        <label className="block text-[16px] font-normal text-[#22070B] font-[Open_Sans] mb-2">
          Site name
        </label>
        <input
          className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] text-[#22070B] 
          placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-7"
          placeholder="Site name"
        />

        <label className="block text-[16px] font-normal text-[#22070B] font-[Open_Sans] mb-2">
          Address
        </label>
        <input
          className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] text-[#22070B] 
          placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-7"
          placeholder="Address"
        />

        <label className="block text-[16px] font-normal text-[#22070B] font-[Open_Sans] mb-2">
          Department
        </label>
        <input
          className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] text-[#22070B] 
          placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-7"
          placeholder="Department"
        />

        <label className="block text-[16px] font-normal text-[#22070B] font-[Open_Sans] mb-2">
          GPS coordinates
        </label>
        <input
          className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] text-[#22070B] 
          placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-7"
          placeholder="GPS coordinates"
        />

        <label className="block text-[16px] font-normal text-[#22070B] font-[Open_Sans] mb-2">
          Website
        </label>
        <input
          className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] text-[#22070B] 
          placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-7"
          placeholder="Website"
        />

        <label className="block text-[16px] font-normal text-[#22070B] font-[Open_Sans] mb-2">
          Social media (Instagram/Facebook)
        </label>
        <input
          className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] text-[#22070B] 
          placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-7"
          placeholder="Social media (Instagram/Facebook)"
        />
      </div>

      <div className="flex justify-between mt-6">
        <button
          className="text-mainRed font-semibold font-[Open_Sans]"
          onClick={handleCancelClick}
        >
          Cancel account creation
        </button>
        <button
          className="bg-mainRed text-white px-6 py-3 rounded-[4px] font-semibold font-[Open_Sans]"
          onClick={nextStep}
        >
          Next
        </button>
      </div>
    </>
  );
}

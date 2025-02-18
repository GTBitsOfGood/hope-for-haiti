"use client";

import React from "react";

interface StepFourProps {
  prevStep: () => void;
  nextStep: () => void;
  handleCancelClick: () => void;
}

export default function StepFour({ prevStep, nextStep, handleCancelClick }: StepFourProps) {
  return (
    <>
      <h2 className="text-[24px] font-bold text-[#22070B] mb-2 font-[Open_Sans]">
        Create partner account
      </h2>
      <h3 className="text-[18px] font-bold text-[#22070B]/70 mb-5 font-[Open_Sans]">
        Facility information
      </h3>

      <p className="text-[16px] text-[#22070B] mb-2">
        <strong>What type of facility is it? Select all that apply:</strong>
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          ["Birthing center", "Clinic", "Hospital", "Elderly care", "Rehabilitation center"],
          ["Dispensary", "Orphanage", "Primary care", "Nutrition/feeding", "Health center"],
          ["Community health education", "Secondary/tertiary healthcare (including surgery)"],
        ].map((column, index) => (
          <div key={index} className="space-y-2">
            {column.map((facility) => (
              <label key={facility} className="flex items-center text-[16px] text-[#22070B]">
                <input type="checkbox" className="mr-2" />
                {facility}
              </label>
            ))}
          </div>
        ))}
      </div>

      <p className="text-[16px] text-[#22070B] mb-2">
        <strong>What type of facility is it? Select all that apply:</strong>
      </p>
      <div className="space-y-2 mb-8">
        {["Non-profit", "For profit", "Faith-based"].map((ftype) => (
          <label key={ftype} className="flex items-center text-[16px] text-[#22070B]">
            <input type="checkbox" className="mr-2" />
            {ftype}
          </label>
        ))}
      </div>

      <label className="block text-[16px] text-[#22070B] mb-2">
        Is this a government-run organization?
      </label>
      <div className="space-y-2 mb-8">
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input type="radio" name="governmentOrg" className="mr-2" /> Yes
        </label>
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input type="radio" name="governmentOrg" className="mr-2" /> No
        </label>
      </div>


      <label className="block text-[16px] text-[#22070B] mb-2">
        Do you have an Emergency Medical Records (EMR) System?
      </label>
      <div className="space-y-2 mb-8">
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input type="radio" name="emrSystem" className="mr-2" /> Yes
        </label>
        <div className="ml-6 mb-5">
          <label className="block text-[16px] text-[#22070B] mb-2">Input name</label>
          <input
            className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
            text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px]"
            placeholder="Input name"
          />
        </div>
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input type="radio" name="emrSystem" className="mr-2" /> No
        </label>
      </div>


      <label className="block text-[16px] text-[#22070B] mb-2">
        Number of inpatient beds
      </label>
      <input
        className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
        text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-8"
        placeholder="Number"
      />


      <label className="block text-[16px] text-[#22070B] mb-2">
        Number of patients served annually
      </label>
      <input
        className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
        text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-8"
        placeholder="Number"
      />

      <p className="text-[16px] text-[#22070B] mb-2">Do you offer community/mobile outreach?</p>
      <div className="space-y-2 mb-8">
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input type="radio" name="communityOutreach" className="mr-2" /> Yes
        </label>
        <div className="ml-6 mb-5">
          <label className="block text-[16px] text-[#22070B] mb-2">
            How often and what services?
          </label>
          <input
            className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
            text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px]"
            placeholder="Service"
          />
        </div>
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input type="radio" name="communityOutreach" className="mr-2" /> No
        </label>
      </div>

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

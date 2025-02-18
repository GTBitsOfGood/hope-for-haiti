"use client";

import React from "react";

interface StepFiveProps {
  prevStep: () => void;
  nextStep: () => void;
  handleCancelClick: () => void;
}

export default function StepFive({ prevStep, nextStep, handleCancelClick }: StepFiveProps) {
  return (
    <>
      <h2 className="text-[24px] font-bold text-[#22070B] mb-2 font-[Open_Sans]">
        Create partner account
      </h2>
      <h3 className="text-[18px] font-bold text-[#22070B]/70 mb-5 font-[Open_Sans]">
        Infrastructure and services
      </h3>

      <label className="block text-[16px] text-[#22070B] mb-2">
        Please provide a general description of your facility including the type and number of buildings.
      </label>
      <textarea
        className="w-full h-[160px] p-3 border border-[#22070B]/10 bg-[#F9F9F9] 
        text-[16px] text-[#22070B] placeholder:text-[#22070B]/50 
        font-[Open_Sans] rounded-[4px] resize-none mb-8"
        placeholder="Description"
      />

      <label className="block text-[16px] text-[#22070B] mb-2">
        Does your facility provide access to clean water?
      </label>
      <div className="space-y-2 mb-8">
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input type="radio" name="cleanWater" className="mr-2" /> Yes
        </label>
        <div className="ml-6 mb-5">
          <label className="block text-[16px] text-[#22070B] mb-2">Please specify how</label>
          <input
            className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
            text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px]"
            placeholder="Answer"
          />
        </div>
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input type="radio" name="cleanWater" className="mr-2" /> No
        </label>
      </div>

      <label className="block text-[16px] text-[#22070B] mb-2">
        Does your facility have sanitation facilities?
      </label>
      <div className="space-y-2 mb-8">
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input type="radio" name="sanitationFacilities" className="mr-2" /> Yes
        </label>
        <div className="ml-6 mb-5">
          <label className="block text-[16px] text-[#22070B] mb-2">Do they lock from the inside?</label>
          <input
            className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
            text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px]"
            placeholder="Answer"
          />
        </div>
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input type="radio" name="sanitationFacilities" className="mr-2" /> No
        </label>
      </div>

      <label className="block text-[16px] text-[#22070B] mb-2">
        Does your facility have a proper medication disposal process?
      </label>
      <div className="space-y-2 mb-8">
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input type="radio" name="medDisposal" className="mr-2" /> Yes
        </label>
        <div className="ml-6 mb-5">
          <label className="block text-[16px] text-[#22070B] mb-2">Please describe the process</label>
          <textarea
            className="w-full h-[160px] p-3 border border-[#22070B]/10 bg-[#F9F9F9] 
            text-[16px] text-[#22070B] placeholder:text-[#22070B]/50 
            font-[Open_Sans] rounded-[4px] resize-none"
            placeholder="Describe"
          />
        </div>
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input type="radio" name="medDisposal" className="mr-2" /> No
        </label>
      </div>

      <label className="block text-[16px] text-[#22070B] mb-2">
        Do you have a vehicle to pick up supplies from the depot?
      </label>
      <div className="space-y-2 mb-2">
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input type="radio" name="vehicleDepot" className="mr-2" /> Yes
        </label>
        <div className="ml-6 mb-5">
          <label className="block text-[16px] text-[#22070B] mb-2">Specify type of vehicle</label>
          <input
            className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
            text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px]"
            placeholder="Describe"
          />
        </div>
      </div>

      <div className="ml-6 mb-2">
        <label className="block text-[16px] text-[#22070B] mb-2">
          Which location is preferred for supply pick up?
        </label>
        <div className="space-y-2">
          <label className="flex items-center text-[16px] text-[#22070B]">
            <input type="radio" name="supplyPickup" className="mr-2" /> Les Cayes
          </label>
          <label className="flex items-center text-[16px] text-[#22070B]">
            <input type="radio" name="supplyPickup" className="mr-2" /> Port-au-Prince
          </label>
        </div>
      </div>

      <label className="flex items-center text-[16px] text-[#22070B]">
        <input type="radio" name="supplyPickup" className="mr-2" /> No
      </label>

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

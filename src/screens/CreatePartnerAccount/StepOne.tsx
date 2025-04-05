/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";

interface StepOneProps {
  nextStep: () => void;
  handleCancelClick: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  partnerDetails: { [key: string]: any };
}

export default function StepOne({
  nextStep,
  handleCancelClick,
  handleInputChange,
  partnerDetails,
}: StepOneProps) {
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
          name="siteName"
          value={(partnerDetails.siteName as string) || ""}
          onChange={handleInputChange}
        />

        <label className="block text-[16px] font-normal text-[#22070B] font-[Open_Sans] mb-2">
          Address
        </label>
        <input
          className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] text-[#22070B] 
          placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-7"
          placeholder="Address"
          name="address"
          value={(partnerDetails.address as string) || ""}
          onChange={handleInputChange}
        />

        <label className="block text-[16px] font-normal text-[#22070B] font-[Open_Sans] mb-2">
          Department
        </label>
        <input
          className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] text-[#22070B] 
          placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-7"
          placeholder="Department"
          name="department"
          value={(partnerDetails.department as string) || ""}
          onChange={handleInputChange}
        />

        <label className="block text-[16px] font-normal text-[#22070B] font-[Open_Sans] mb-2">
          GPS coordinates
        </label>
        <input
          className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] text-[#22070B] 
          placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-7"
          placeholder="GPS coordinates"
          name="gpsCoordinates"
          value={(partnerDetails.gpsCoordinates as string) || ""}
          onChange={handleInputChange}
        />

        <label className="block text-[16px] font-normal text-[#22070B] font-[Open_Sans] mb-2">
          Website
        </label>
        <input
          className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] text-[#22070B] 
          placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-7"
          placeholder="Website"
          name="website"
          value={(partnerDetails.website as string) || ""}
          onChange={handleInputChange}
        />

        <label className="block text-[16px] font-normal text-[#22070B] font-[Open_Sans] mb-2">
          Social media (Instagram/Facebook)
        </label>
        <input
          className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] text-[#22070B] 
          placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-7"
          placeholder="Social media (Instagram/Facebook)"
          name="socialMedia"
          value={(partnerDetails.socialMedia as string) || ""}
          onChange={handleInputChange}
        />
      </div>

      <div className="flex justify-between mt-6">
        <button
          className="text-mainRed font-semibold font-[Open_Sans]"
          onClick={handleCancelClick}
          type="button"
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

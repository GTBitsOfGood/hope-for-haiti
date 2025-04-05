"use client";

import React from "react";

interface StepEightProps {
  prevStep: () => void;
  nextStep: () => void;
  handleCancelClick: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  partnerDetails: { [key: string]: any };
}

export default function StepEight({
  prevStep,
  nextStep,
  handleCancelClick,
  handleInputChange,
  partnerDetails,
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
        ["Number of doctors", "numberOfDoctors"],
        ["Number of nurses", "numberOfNurses"],
        ["Number of midwives", "numberOfMidwives"],
        ["Number of auxiliaries", "numberOfAuxilaries"],
        ["Number of statisticians", "numberOfStatisticians"],
        ["Number of pharmacists", "numberOfPharmacists"],
        ["Number of CHW", "numberOfCHW"],
        ["Number of administrative", "numberOfAdministrative"],
        ["Number of health officers", "numberOfHealthOfficers"],
        ["Total number of staff", "totalNumberOfStaff"],
        ["Other staff not listed", "other"],
      ].map(([label, name], index) => (
        <div key={index} className="mb-5">
          <label className="block text-[16px] text-[#22070B] mb-2">
            {label}
          </label>
          <input
            className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
            text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px]"
            placeholder={label}
            name={name}
            value={partnerDetails[name] || ""}
            onChange={handleInputChange}
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

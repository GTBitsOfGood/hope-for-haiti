"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";

interface StepThreeProps {
  prevStep: () => void;
  nextStep: () => void;
  handleCancelClick: () => void;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  partnerDetails: { [key: string]: any };
}

export default function StepThree({
  prevStep,
  nextStep,
  handleCancelClick,
  handleInputChange,
  handleFileUpload,
  partnerDetails,
}: StepThreeProps) {
  return (
    <>
      <h2 className="text-[24px] font-bold text-[#22070B] mb-2">
        Create partner account
      </h2>
      <h3 className="text-[18px] font-bold text-[#22070B]/70 mb-4">
        Introduction
      </h3>
      <label className="block text-[16px] text-[#22070B] mb-1">
        Organization history
      </label>
      <textarea
        className="w-full h-36 p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
        text-[#22070B] placeholder:text-[#22070B]/50 rounded-[4px] 
        border-solid resize-none mb-7"
        placeholder="Organization history"
        name="organizationHistory"
        value={partnerDetails.organizationHistory}
        onChange={handleInputChange}
      />

      <p className="text-[16px] text-[#22070B] mb-2">
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
            className="flex items-center text-[16px] text-[#22070B]"
          >
            <input
              type="radio"
              name="supportRequested"
              className="mr-2"
              value={option}
              checked={option === partnerDetails.supportRequested}
              onChange={handleInputChange}
            />
            {option}
          </label>
        ))}
      </div>

      <label className="block text-[16px] text-[#22070B] mb-1">
        Date organization was established
      </label>
      <input
        className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
        text-[#22070B] placeholder:text-[#22070B]/50 rounded-[4px] 
        border-solid mb-7"
        placeholder="00/00/0000"
        name="yearOrganizationEstablished"
        value={partnerDetails.yearOrganizationEstablished}
        onChange={handleInputChange}
      />

      <p className="text-[16px] text-[#22070B] mb-2">
        Is your organization registered with MSSP?
      </p>
      <div className="space-y-2 mb-7">
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input
            type="radio"
            name="registeredWithMssp"
            value="true"
            checked={partnerDetails.registeredWithMssp === "true"}
            onChange={handleInputChange}
            className="mr-2"
          />
          Yes
        </label>

        <div className="ml-6">
          <label className="block text-[16px] text-[#22070B] mb-1">
            Please provide a copy of the license
          </label>
          <div className="relative w-full">
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              name="licenseCopy"
              onChange={handleFileUpload}
              accept=".pdf"
              value={partnerDetails.licenseCopy}
            />
            <div
              className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
              text-[#22070B] placeholder:text-[#22070B]/50 rounded-[4px] 
              border-solid"
            >
              Upload File
            </div>
          </div>
        </div>

        <label className="flex items-center text-[16px] text-[#22070B]">
          <input
            type="radio"
            name="registeredWithMssp"
            className="mr-2"
            value="false"
            checked={partnerDetails.registeredWithMssp === "false"}
            onChange={handleInputChange}
          />
          No
        </label>
      </div>

      <label className="block text-[16px] text-[#22070B] mb-1">
        Program updates since last report
      </label>
      <textarea
        className="w-full h-36 p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
        text-[#22070B] placeholder:text-[#22070B]/50 rounded-[4px] 
        border-solid resize-none mb-7"
        placeholder="Updates"
        name="programUpdatesSinceLastReport"
        value={partnerDetails.programUpdatesSinceLastReport}
        onChange={handleInputChange}
      />

      <div className="flex justify-between mt-6">
        <button
          className="text-mainRed font-semibold"
          onClick={handleCancelClick}
          type="button"
        >
          Cancel account creation
        </button>
        <div>
          <button
            className="border border-mainRed text-mainRed px-6 py-3 rounded-[4px] font-semibold mr-4"
            onClick={prevStep}
            type="button"
          >
            Previous
          </button>
          <button
            className="bg-mainRed text-white px-6 py-3 rounded-[4px] font-semibold"
            onClick={nextStep}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}

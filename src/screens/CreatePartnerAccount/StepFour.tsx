/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";

interface StepFourProps {
  prevStep: () => void;
  nextStep: () => void;
  handleCancelClick: () => void;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  partnerDetails: { [key: string]: any };
}

export default function StepFour({
  prevStep,
  nextStep,
  handleCancelClick,
  handleInputChange,
  handleCheckboxChange,
  partnerDetails,
}: StepFourProps) {
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
          [
            ["Birthing center", "birthing_center"],
            ["Clinic", "clinic"],
            ["Hospital", "hospital"],
            ["Elderly care", "elderly_care"],
            ["Rehabilitation center", "rehabilitation_center"],
          ],
          [
            ["Dispensary", "dispensary"],
            ["Orphanage", "orphanage"],
            ["Primary care", "primary_care"],
            ["Nutrition/feeding", "nutrition_feeding"],
            ["Health center", "health_center"],
          ],
          [
            ["Community health education", "community_health_education"],
            [
              "Secondary/tertiary healthcare (including surgery)",
              "secondary_tertiary_healthcare",
            ],
          ],
        ].map((column, index) => (
          <div key={index} className="space-y-2">
            {column.map(([label, value]) => (
              <label
                key={value}
                className="flex items-center text-[16px] text-[#22070B]"
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  value={value}
                  onChange={handleCheckboxChange}
                  checked={
                    partnerDetails["facilityType"] &&
                    partnerDetails["facilityType"].includes(value)
                  }
                  name="facilityType"
                />
                {label}
              </label>
            ))}
          </div>
        ))}
      </div>

      <p className="text-[16px] text-[#22070B] mb-2">
        <strong>What type of facility is it? Select all that apply:</strong>
      </p>
      <div className="space-y-2 mb-8">
        {[
          ["Non-profit", "non_profit"],
          ["For profit", "for_profit"],
          ["Faith-based", "faith_based"],
        ].map(([ftype, name]) => (
          <label
            key={ftype}
            className="flex items-center text-[16px] text-[#22070B]"
          >
            <input
              type="checkbox"
              className="mr-2"
              name="organizationType"
              checked={
                partnerDetails["organizationType"] &&
                partnerDetails["organizationType"].includes(name)
              }
              value={name}
              onChange={handleCheckboxChange}
            />
            {ftype}
          </label>
        ))}
      </div>

      <label className="block text-[16px] text-[#22070B] mb-2">
        Is this a government-run organization?
      </label>
      <div className="space-y-2 mb-8">
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input
            type="radio"
            name="governmentRun"
            className="mr-2"
            value="true"
            checked={partnerDetails.governmentRun === "true"}
            onChange={handleInputChange}
          />
          Yes
        </label>
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input
            type="radio"
            name="governmentRun"
            className="mr-2"
            value="false"
            checked={partnerDetails.governmentRun === "false"}
            onChange={handleInputChange}
          />{" "}
          No
        </label>
      </div>

      <label className="block text-[16px] text-[#22070B] mb-2">
        Do you have an Emergency Medical Records (EMR) System?
      </label>
      <div className="space-y-2 mb-8">
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input
            type="radio"
            name="emergencyMedicalRecordsSystemPresent"
            className="mr-2"
            value="true"
            checked={
              partnerDetails.emergencyMedicalRecordsSystemPresent === "true"
            }
            onChange={handleInputChange}
          />
          Yes
        </label>
        <div className="ml-6 mb-5">
          <label className="block text-[16px] text-[#22070B] mb-2">
            Input name
          </label>
          <input
            className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
            text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px]"
            placeholder="Input name"
            name="emergencyMedicalRecordsSystemName"
            value={partnerDetails.emergencyMedicalRecordsSystemName || ""}
            onChange={handleInputChange}
          />
        </div>
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input
            type="radio"
            name="emergencyMedicalRecordsSystemPresent"
            className="mr-2"
            value="false"
            checked={
              partnerDetails.emergencyMedicalRecordsSystemPresent === "false"
            }
            onChange={handleInputChange}
          />
          No
        </label>
      </div>

      <label className="block text-[16px] text-[#22070B] mb-2">
        Number of inpatient beds
      </label>
      <input
        className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
        text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-8"
        placeholder="Number"
        name="numberOfInpatientBeds"
        value={partnerDetails.numberOfInpatientBeds || ""}
        onChange={handleInputChange}
      />

      <label className="block text-[16px] text-[#22070B] mb-2">
        Number of patients served annually
      </label>
      <input
        className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
        text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px] mb-8"
        placeholder="Number"
        name="numberOfPatientsServedAnnually"
        value={partnerDetails.numberOfPatientsServedAnnually || ""}
        onChange={handleInputChange}
      />

      <p className="text-[16px] text-[#22070B] mb-2">
        Do you offer community/mobile outreach?
      </p>
      <div className="space-y-2 mb-8">
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input
            type="radio"
            name="communityMobileOutreachOffered"
            className="mr-2"
            value="true"
            checked={partnerDetails.communityMobileOutreachOffered === "true"}
            onChange={handleInputChange}
          />{" "}
          Yes
        </label>
        <div className="ml-6 mb-5">
          <label className="block text-[16px] text-[#22070B] mb-2">
            How often and what services?
          </label>
          <input
            className="w-full p-3 border border-[#22070B]/10 bg-[#F9F9F9] text-[16px] 
            text-[#22070B] placeholder:text-[#22070B]/50 font-[Open_Sans] rounded-[4px]"
            placeholder="Service"
            name="communityMobileOutreachDescription"
            value={partnerDetails.communityMobileOutreachDescription || ""}
            onChange={handleInputChange}
          />
        </div>
        <label className="flex items-center text-[16px] text-[#22070B]">
          <input
            type="radio"
            name="communityMobileOutreachOffered"
            className="mr-2"
            value="false"
            checked={partnerDetails.communityMobileOutreachOffered === "false"}
            onChange={handleInputChange}
          />
          No
        </label>
      </div>

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

"use client";

import React from "react";

interface ProgramServicesData {
  medicalServicesProvided: string;
  otherServicesProvided: string;
}

interface ProgramServicesProps {
  isEditingOrg: boolean;
  setIsEditingOrg: React.Dispatch<React.SetStateAction<boolean>>;
  programServicesData: ProgramServicesData;
  setProgramServicesData: React.Dispatch<
    React.SetStateAction<ProgramServicesData>
  >;
}

export default function ProgramServices({
  isEditingOrg,
  setIsEditingOrg,
  programServicesData,
  setProgramServicesData,
}: ProgramServicesProps) {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-bold text-[#2774AE]">
          Programs & Services Provided
        </h3>
        <button
          onClick={() => setIsEditingOrg(!isEditingOrg)}
          className="border border-mainRed text-mainRed px-4 py-2 rounded-[4px] font-semibold hover:bg-mainRed/10"
        >
          {isEditingOrg ? "Save" : "Edit"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 max-w-xl">
        <p className="text-[18px] font-semibold text-[#22070B]">
          Medical services provided
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={programServicesData.medicalServicesProvided}
            onChange={(e) =>
              setProgramServicesData({
                ...programServicesData,
                medicalServicesProvided: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {programServicesData.medicalServicesProvided}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Other services provided not listed above
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={programServicesData.otherServicesProvided}
            onChange={(e) =>
              setProgramServicesData({
                ...programServicesData,
                otherServicesProvided: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {programServicesData.otherServicesProvided}
          </p>
        )}
      </div>
    </div>
  );
}

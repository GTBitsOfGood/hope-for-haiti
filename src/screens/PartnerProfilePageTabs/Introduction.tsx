"use client";

import React from "react";

interface IntroductionData {
  organizationHistory: string;
  typeOfSupportRequested: string;
  dateEstablished: string;
  isRegisteredWithMSSP: string;
  programUpdatesSinceLastReport: string;
}

interface IntroductionProps {
  isEditingOrg: boolean;
  setIsEditingOrg: React.Dispatch<React.SetStateAction<boolean>>;
  introductionData: IntroductionData;
  setIntroductionData: React.Dispatch<React.SetStateAction<IntroductionData>>;
}

export default function Introduction({
  isEditingOrg,
  setIsEditingOrg,
  introductionData,
  setIntroductionData,
}: IntroductionProps) {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-bold text-[#2774AE]">Introduction</h3>
        <button
          onClick={() => setIsEditingOrg(!isEditingOrg)}
          className="border border-mainRed text-mainRed px-4 py-2 rounded-[4px] font-semibold hover:bg-mainRed/10"
        >
          {isEditingOrg ? "Save" : "Edit"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 max-w-xl">
        <p className="text-[18px] font-semibold text-[#22070B]">
          Organization history
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={introductionData.organizationHistory}
            onChange={(e) =>
              setIntroductionData({
                ...introductionData,
                organizationHistory: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {introductionData.organizationHistory}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Type of support requested
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={introductionData.typeOfSupportRequested}
            onChange={(e) =>
              setIntroductionData({
                ...introductionData,
                typeOfSupportRequested: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {introductionData.typeOfSupportRequested}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Date organization was established
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={introductionData.dateEstablished}
            onChange={(e) =>
              setIntroductionData({
                ...introductionData,
                dateEstablished: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {introductionData.dateEstablished}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Is your organization registered with MSSP?
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={introductionData.isRegisteredWithMSSP}
            onChange={(e) =>
              setIntroductionData({
                ...introductionData,
                isRegisteredWithMSSP: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {introductionData.isRegisteredWithMSSP}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Program updates since last report
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={introductionData.programUpdatesSinceLastReport}
            onChange={(e) =>
              setIntroductionData({
                ...introductionData,
                programUpdatesSinceLastReport: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {introductionData.programUpdatesSinceLastReport}
          </p>
        )}
      </div>
    </div>
  );
}

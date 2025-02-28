"use client";

import React from "react";

interface FacilityData {
  typeOfFacility: string;
  governmentRunOrganization: string;
  hasEMRSystem: string;
  numberOfInpatientBeds: string;
  numberOfPatientsServedAnnually: string;
  communityMobileOutreach: string;
}

interface FacilityInformationProps {
  isEditingOrg: boolean;
  setIsEditingOrg: React.Dispatch<React.SetStateAction<boolean>>;
  facilityData: FacilityData;
  setFacilityData: React.Dispatch<React.SetStateAction<FacilityData>>;
}

export default function FacilityInformation({
  isEditingOrg,
  setIsEditingOrg,
  facilityData,
  setFacilityData,
}: FacilityInformationProps) {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-bold text-[#2774AE]">
          Facility Information
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
          Type of facility
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={facilityData.typeOfFacility}
            onChange={(e) =>
              setFacilityData({
                ...facilityData,
                typeOfFacility: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {facilityData.typeOfFacility}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Government run organization?
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={facilityData.governmentRunOrganization}
            onChange={(e) =>
              setFacilityData({
                ...facilityData,
                governmentRunOrganization: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {facilityData.governmentRunOrganization}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Do you have an Emergency Medical Records (EMR) System?
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={facilityData.hasEMRSystem}
            onChange={(e) =>
              setFacilityData({ ...facilityData, hasEMRSystem: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {facilityData.hasEMRSystem}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of inpatient beds
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={facilityData.numberOfInpatientBeds}
            onChange={(e) =>
              setFacilityData({
                ...facilityData,
                numberOfInpatientBeds: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {facilityData.numberOfInpatientBeds}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of patients served annually
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={facilityData.numberOfPatientsServedAnnually}
            onChange={(e) =>
              setFacilityData({
                ...facilityData,
                numberOfPatientsServedAnnually: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {facilityData.numberOfPatientsServedAnnually}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Do you offer community/mobile outreach?
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={facilityData.communityMobileOutreach}
            onChange={(e) =>
              setFacilityData({
                ...facilityData,
                communityMobileOutreach: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {facilityData.communityMobileOutreach}
          </p>
        )}
      </div>
    </div>
  );
}

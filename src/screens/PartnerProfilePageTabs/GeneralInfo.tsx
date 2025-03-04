"use client";

import React from "react";

interface OrgData {
  siteName: string;
  address: string;
  department: string;
  gpsCoordinates: string;
  website: string;
  socialMedia: string;
}

interface GeneralInfoProps {
  isEditingOrg: boolean;
  setIsEditingOrg: React.Dispatch<React.SetStateAction<boolean>>;
  orgData: OrgData;
  setOrgData: React.Dispatch<React.SetStateAction<OrgData>>;
}

export default function GeneralInfo({
  isEditingOrg,
  setIsEditingOrg,
  orgData,
  setOrgData,
}: GeneralInfoProps) {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-bold text-[#2774AE]">
          General information
        </h3>
        <button
          onClick={() => setIsEditingOrg(!isEditingOrg)}
          className="border border-mainRed text-mainRed px-4 py-2 rounded-[4px] font-semibold hover:bg-mainRed/10"
        >
          {isEditingOrg ? "Save" : "Edit"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 max-w-xl">
        <p className="text-[18px] font-semibold text-[#22070B]">Site name</p>
        {isEditingOrg ? (
          <input
            type="text"
            value={orgData.siteName}
            onChange={(e) =>
              setOrgData({ ...orgData, siteName: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">{orgData.siteName}</p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">Address</p>
        {isEditingOrg ? (
          <input
            type="text"
            value={orgData.address}
            onChange={(e) =>
              setOrgData({ ...orgData, address: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">{orgData.address}</p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">Department</p>
        {isEditingOrg ? (
          <input
            type="text"
            value={orgData.department}
            onChange={(e) =>
              setOrgData({ ...orgData, department: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">{orgData.department}</p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          GPS coordinates
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={orgData.gpsCoordinates}
            onChange={(e) =>
              setOrgData({ ...orgData, gpsCoordinates: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">{orgData.gpsCoordinates}</p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">Website</p>
        {isEditingOrg ? (
          <input
            type="text"
            value={orgData.website}
            onChange={(e) =>
              setOrgData({ ...orgData, website: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">{orgData.website}</p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Social media (Instagram/ Facebook)
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={orgData.socialMedia}
            onChange={(e) =>
              setOrgData({ ...orgData, socialMedia: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">{orgData.socialMedia}</p>
        )}
      </div>
    </div>
  );
}

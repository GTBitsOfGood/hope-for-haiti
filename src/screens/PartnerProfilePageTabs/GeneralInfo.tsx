"use client";

import React, { useState } from "react";
import { PartnerDetails } from "@/schema/partnerDetails";

interface GeneralInfoProps {
  isEditingOrg: boolean;
  setIsEditingOrg: React.Dispatch<React.SetStateAction<boolean>>;
  partnerDetails: PartnerDetails;
  onSave: (updatedDetails: Partial<PartnerDetails>) => Promise<void>;
  isSaving: boolean;
}

export default function GeneralInfo({
  isEditingOrg,
  setIsEditingOrg,
  partnerDetails,
  onSave,
  isSaving,
}: GeneralInfoProps) {
  const [formData, setFormData] = useState({
    siteName: partnerDetails.siteName,
    address: partnerDetails.address,
    department: partnerDetails.department,
    gpsCoordinates: partnerDetails.gpsCoordinates,
    website: partnerDetails.website,
    socialMedia: partnerDetails.socialMedia,
  });

  const handleSave = async () => {
    await onSave(formData);
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      siteName: partnerDetails.siteName,
      address: partnerDetails.address,
      department: partnerDetails.department,
      gpsCoordinates: partnerDetails.gpsCoordinates,
      website: partnerDetails.website,
      socialMedia: partnerDetails.socialMedia,
    });
    setIsEditingOrg(false);
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-bold text-[#2774AE]">
          General information
        </h3>
        <div className="flex gap-2">
          {isEditingOrg && (
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="border border-gray-400 text-gray-600 px-4 py-2 rounded-[4px] font-semibold hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={isEditingOrg ? handleSave : () => setIsEditingOrg(true)}
            disabled={isSaving}
            className="border border-mainRed text-mainRed px-4 py-2 rounded-[4px] font-semibold hover:bg-mainRed/10 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : isEditingOrg ? "Save" : "Edit"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 max-w-xl">
        <p className="text-[18px] font-semibold text-[#22070B]">Site name</p>
        {isEditingOrg ? (
          <input
            type="text"
            value={formData.siteName}
            onChange={(e) =>
              setFormData({ ...formData, siteName: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.siteName}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">Address</p>
        {isEditingOrg ? (
          <input
            type="text"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">{partnerDetails.address}</p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">Department</p>
        {isEditingOrg ? (
          <input
            type="text"
            value={formData.department}
            onChange={(e) =>
              setFormData({ ...formData, department: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.department}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          GPS coordinates
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={formData.gpsCoordinates}
            onChange={(e) =>
              setFormData({ ...formData, gpsCoordinates: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.gpsCoordinates}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">Website</p>
        {isEditingOrg ? (
          <input
            type="text"
            value={formData.website}
            onChange={(e) =>
              setFormData({ ...formData, website: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">{partnerDetails.website}</p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Social media (Instagram/ Facebook)
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={formData.socialMedia}
            onChange={(e) =>
              setFormData({ ...formData, socialMedia: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.socialMedia}
          </p>
        )}
      </div>
    </div>
  );
}

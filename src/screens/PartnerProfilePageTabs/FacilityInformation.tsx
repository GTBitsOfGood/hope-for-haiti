"use client";

import React, { useState } from "react";
import { PartnerDetails } from "@/schema/partnerDetails";

interface FacilityInformationProps {
  isEditingOrg: boolean;
  setIsEditingOrg: React.Dispatch<React.SetStateAction<boolean>>;
  partnerDetails: PartnerDetails;
  onSave: (updatedDetails: Partial<PartnerDetails>) => Promise<void>;
  isSaving: boolean;
}

export default function FacilityInformation({
  isEditingOrg,
  setIsEditingOrg,
  partnerDetails,
  onSave,
  isSaving,
}: FacilityInformationProps) {
  const [formData, setFormData] = useState({
    facilityType: partnerDetails.facilityType,
    organizationType: partnerDetails.organizationType,
    governmentRun: partnerDetails.governmentRun,
    emergencyMedicalRecordsSystemPresent:
      partnerDetails.emergencyMedicalRecordsSystemPresent,
    emergencyMedicalRecordsSystemName:
      partnerDetails.emergencyMedicalRecordsSystemName,
    numberOfInpatientBeds: partnerDetails.numberOfInpatientBeds,
    numberOfPatientsServedAnnually:
      partnerDetails.numberOfPatientsServedAnnually,
    communityMobileOutreachOffered:
      partnerDetails.communityMobileOutreachOffered,
    communityMobileOutreachDescription:
      partnerDetails.communityMobileOutreachDescription,
  });

  const handleSave = async () => {
    await onSave(formData);
  };

  const handleCancel = () => {
    setFormData({
      facilityType: partnerDetails.facilityType,
      organizationType: partnerDetails.organizationType,
      governmentRun: partnerDetails.governmentRun,
      emergencyMedicalRecordsSystemPresent:
        partnerDetails.emergencyMedicalRecordsSystemPresent,
      emergencyMedicalRecordsSystemName:
        partnerDetails.emergencyMedicalRecordsSystemName,
      numberOfInpatientBeds: partnerDetails.numberOfInpatientBeds,
      numberOfPatientsServedAnnually:
        partnerDetails.numberOfPatientsServedAnnually,
      communityMobileOutreachOffered:
        partnerDetails.communityMobileOutreachOffered,
      communityMobileOutreachDescription:
        partnerDetails.communityMobileOutreachDescription,
    });
    setIsEditingOrg(false);
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-bold text-[#2774AE]">
          Facility Information
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
        <p className="text-[18px] font-semibold text-[#22070B]">
          Government Run
        </p>
        {isEditingOrg ? (
          <select
            value={formData.governmentRun.toString()}
            onChange={(e) =>
              setFormData({
                ...formData,
                governmentRun: e.target.value === "true",
              })
            }
            className="border p-1"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.governmentRun ? "Yes" : "No"}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          EMR System Present
        </p>
        {isEditingOrg ? (
          <select
            value={formData.emergencyMedicalRecordsSystemPresent.toString()}
            onChange={(e) =>
              setFormData({
                ...formData,
                emergencyMedicalRecordsSystemPresent: e.target.value === "true",
              })
            }
            className="border p-1"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.emergencyMedicalRecordsSystemPresent ? "Yes" : "No"}
          </p>
        )}

        {formData.emergencyMedicalRecordsSystemPresent && (
          <>
            <p className="text-[18px] font-semibold text-[#22070B]">
              EMR System Name
            </p>
            {isEditingOrg ? (
              <input
                type="text"
                value={formData.emergencyMedicalRecordsSystemName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyMedicalRecordsSystemName: e.target.value,
                  })
                }
                className="border p-1"
              />
            ) : (
              <p className="text-[16px] text-[#22070B]">
                {partnerDetails.emergencyMedicalRecordsSystemName}
              </p>
            )}
          </>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of Inpatient Beds
        </p>
        {isEditingOrg ? (
          <input
            type="number"
            min="0"
            value={formData.numberOfInpatientBeds}
            onChange={(e) =>
              setFormData({
                ...formData,
                numberOfInpatientBeds: parseInt(e.target.value) || 0,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.numberOfInpatientBeds}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Patients Served Annually
        </p>
        {isEditingOrg ? (
          <input
            type="number"
            min="0"
            value={formData.numberOfPatientsServedAnnually}
            onChange={(e) =>
              setFormData({
                ...formData,
                numberOfPatientsServedAnnually: parseInt(e.target.value) || 0,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.numberOfPatientsServedAnnually}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Mobile Outreach Offered
        </p>
        {isEditingOrg ? (
          <select
            value={formData.communityMobileOutreachOffered.toString()}
            onChange={(e) =>
              setFormData({
                ...formData,
                communityMobileOutreachOffered: e.target.value === "true",
              })
            }
            className="border p-1"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.communityMobileOutreachOffered ? "Yes" : "No"}
          </p>
        )}

        {formData.communityMobileOutreachOffered && (
          <>
            <p className="text-[18px] font-semibold text-[#22070B]">
              Mobile Outreach Description
            </p>
            {isEditingOrg ? (
              <textarea
                value={formData.communityMobileOutreachDescription}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    communityMobileOutreachDescription: e.target.value,
                  })
                }
                className="border p-1 min-h-[100px]"
              />
            ) : (
              <p className="text-[16px] text-[#22070B]">
                {partnerDetails.communityMobileOutreachDescription}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

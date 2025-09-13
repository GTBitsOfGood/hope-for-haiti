"use client";

import React, { useState } from "react";
import { PartnerDetails } from "@/schema/partnerDetails";

interface IntroductionProps {
  isEditingOrg: boolean;
  setIsEditingOrg: React.Dispatch<React.SetStateAction<boolean>>;
  partnerDetails: PartnerDetails;
  onSave: (updatedDetails: Partial<PartnerDetails>) => Promise<void>;
  isSaving: boolean;
}

export default function Introduction({
  isEditingOrg,
  setIsEditingOrg,
  partnerDetails,
  onSave,
  isSaving,
}: IntroductionProps) {
  const [formData, setFormData] = useState({
    organizationHistory: partnerDetails.organizationHistory,
    supportRequested: partnerDetails.supportRequested,
    yearOrganizationEstablished: partnerDetails.yearOrganizationEstablished,
    registeredWithMssp: partnerDetails.registeredWithMssp,
    proofOfRegistrationWithMssp: partnerDetails.proofOfRegistrationWithMssp,
    programUpdatesSinceLastReport: partnerDetails.programUpdatesSinceLastReport,
  });

  const handleSave = async () => {
    await onSave(formData);
  };

  const handleCancel = () => {
    setFormData({
      organizationHistory: partnerDetails.organizationHistory,
      supportRequested: partnerDetails.supportRequested,
      yearOrganizationEstablished: partnerDetails.yearOrganizationEstablished,
      registeredWithMssp: partnerDetails.registeredWithMssp,
      proofOfRegistrationWithMssp: partnerDetails.proofOfRegistrationWithMssp,
      programUpdatesSinceLastReport:
        partnerDetails.programUpdatesSinceLastReport,
    });
    setIsEditingOrg(false);
  };

  const supportOptions = [
    { value: "ongoing_support", label: "Ongoing Support" },
    { value: "mobile_clinic_support", label: "Mobile Clinic Support" },
    { value: "one_time_request", label: "One Time Request" },
    { value: "project_support", label: "Project Support" },
  ];

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-bold text-[#2774AE]">Introduction</h3>
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
          Organization history
        </p>
        {isEditingOrg ? (
          <textarea
            value={formData.organizationHistory}
            onChange={(e) =>
              setFormData({
                ...formData,
                organizationHistory: e.target.value,
              })
            }
            className="border p-1 min-h-[100px]"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.organizationHistory}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Type of support requested
        </p>
        {isEditingOrg ? (
          <select
            value={formData.supportRequested}
            onChange={(e) =>
              setFormData({
                ...formData,
                supportRequested: e.target
                  .value as typeof formData.supportRequested,
              })
            }
            className="border p-1"
          >
            {supportOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {supportOptions.find(
              (opt) => opt.value === partnerDetails.supportRequested
            )?.label || partnerDetails.supportRequested}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Year organization was established
        </p>
        {isEditingOrg ? (
          <input
            type="number"
            min="1800"
            max={new Date().getFullYear()}
            value={formData.yearOrganizationEstablished}
            onChange={(e) =>
              setFormData({
                ...formData,
                yearOrganizationEstablished:
                  parseInt(e.target.value) || new Date().getFullYear(),
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.yearOrganizationEstablished}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Is your organization registered with MSSP?
        </p>
        {isEditingOrg ? (
          <select
            value={formData.registeredWithMssp.toString()}
            onChange={(e) =>
              setFormData({
                ...formData,
                registeredWithMssp: e.target.value === "true",
              })
            }
            className="border p-1"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.registeredWithMssp ? "Yes" : "No"}
          </p>
        )}

        {formData.registeredWithMssp && (
          <>
            <p className="text-[18px] font-semibold text-[#22070B]">
              Proof of registration with MSSP
            </p>
            {isEditingOrg ? (
              <input
                type="text"
                value={formData.proofOfRegistrationWithMssp}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    proofOfRegistrationWithMssp: e.target.value,
                  })
                }
                className="border p-1"
                placeholder="Document name or reference"
              />
            ) : (
              <p className="text-[16px] text-[#22070B]">
                {partnerDetails.proofOfRegistrationWithMssp || "Not provided"}
              </p>
            )}
          </>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Program updates since last report
        </p>
        {isEditingOrg ? (
          <textarea
            value={formData.programUpdatesSinceLastReport}
            onChange={(e) =>
              setFormData({
                ...formData,
                programUpdatesSinceLastReport: e.target.value,
              })
            }
            className="border p-1 min-h-[100px]"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.programUpdatesSinceLastReport}
          </p>
        )}
      </div>
    </div>
  );
}

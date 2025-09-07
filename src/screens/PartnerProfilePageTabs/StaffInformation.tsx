"use client";

import React, { useState } from "react";
import { PartnerDetails } from "@/schema/partnerDetails";

interface StaffInformationProps {
  isEditingOrg: boolean;
  setIsEditingOrg: React.Dispatch<React.SetStateAction<boolean>>;
  partnerDetails: PartnerDetails;
  onSave: (updatedDetails: Partial<PartnerDetails>) => Promise<void>;
  isSaving: boolean;
}

export default function StaffInformation({
  isEditingOrg,
  setIsEditingOrg,
  partnerDetails,
  onSave,
  isSaving,
}: StaffInformationProps) {
  const [formData, setFormData] = useState({
    numberOfDoctors: partnerDetails.numberOfDoctors,
    numberOfNurses: partnerDetails.numberOfNurses,
    numberOfMidwives: partnerDetails.numberOfMidwives,
    numberOfAuxilaries: partnerDetails.numberOfAuxilaries,
    numberOfStatisticians: partnerDetails.numberOfStatisticians,
    numberOfPharmacists: partnerDetails.numberOfPharmacists,
    numberOfCHW: partnerDetails.numberOfCHW,
    numberOfAdministrative: partnerDetails.numberOfAdministrative,
    numberOfHealthOfficers: partnerDetails.numberOfHealthOfficers,
    totalNumberOfStaff: partnerDetails.totalNumberOfStaff,
    other: partnerDetails.other,
  });

  const handleSave = async () => {
    await onSave(formData);
  };

  const handleCancel = () => {
    setFormData({
      numberOfDoctors: partnerDetails.numberOfDoctors,
      numberOfNurses: partnerDetails.numberOfNurses,
      numberOfMidwives: partnerDetails.numberOfMidwives,
      numberOfAuxilaries: partnerDetails.numberOfAuxilaries,
      numberOfStatisticians: partnerDetails.numberOfStatisticians,
      numberOfPharmacists: partnerDetails.numberOfPharmacists,
      numberOfCHW: partnerDetails.numberOfCHW,
      numberOfAdministrative: partnerDetails.numberOfAdministrative,
      numberOfHealthOfficers: partnerDetails.numberOfHealthOfficers,
      totalNumberOfStaff: partnerDetails.totalNumberOfStaff,
      other: partnerDetails.other,
    });
    setIsEditingOrg(false);
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-bold text-[#2774AE]">
          Staff Information
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
          Number of Doctors
        </p>
        {isEditingOrg ? (
          <input
            type="number"
            min="0"
            value={formData.numberOfDoctors}
            onChange={(e) =>
              setFormData({
                ...formData,
                numberOfDoctors: parseInt(e.target.value) || 0,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.numberOfDoctors}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of Nurses
        </p>
        {isEditingOrg ? (
          <input
            type="number"
            min="0"
            value={formData.numberOfNurses}
            onChange={(e) =>
              setFormData({
                ...formData,
                numberOfNurses: parseInt(e.target.value) || 0,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.numberOfNurses}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of Midwives
        </p>
        {isEditingOrg ? (
          <input
            type="number"
            min="0"
            value={formData.numberOfMidwives}
            onChange={(e) =>
              setFormData({
                ...formData,
                numberOfMidwives: parseInt(e.target.value) || 0,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.numberOfMidwives}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of Health Officers
        </p>
        {isEditingOrg ? (
          <input
            type="number"
            min="0"
            value={formData.numberOfHealthOfficers}
            onChange={(e) =>
              setFormData({
                ...formData,
                numberOfHealthOfficers: parseInt(e.target.value) || 0,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.numberOfHealthOfficers}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of Pharmacists
        </p>
        {isEditingOrg ? (
          <input
            type="number"
            min="0"
            value={formData.numberOfPharmacists}
            onChange={(e) =>
              setFormData({
                ...formData,
                numberOfPharmacists: parseInt(e.target.value) || 0,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.numberOfPharmacists}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of CHW
        </p>
        {isEditingOrg ? (
          <input
            type="number"
            min="0"
            value={formData.numberOfCHW}
            onChange={(e) =>
              setFormData({
                ...formData,
                numberOfCHW: parseInt(e.target.value) || 0,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.numberOfCHW}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Total Number of Staff
        </p>
        {isEditingOrg ? (
          <input
            type="number"
            min="0"
            value={formData.totalNumberOfStaff}
            onChange={(e) =>
              setFormData({
                ...formData,
                totalNumberOfStaff: parseInt(e.target.value) || 0,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.totalNumberOfStaff}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">Other Staff</p>
        {isEditingOrg ? (
          <textarea
            value={formData.other}
            onChange={(e) =>
              setFormData({ ...formData, other: e.target.value })
            }
            className="border p-1 min-h-[100px]"
            placeholder="Describe other staff not listed above"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.other || "None"}
          </p>
        )}
      </div>
    </div>
  );
}

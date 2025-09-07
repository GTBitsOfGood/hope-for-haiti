"use client";

import React, { useState } from "react";
import { PartnerDetails } from "@/schema/partnerDetails";

interface InfrastructureServicesProps {
  isEditingOrg: boolean;
  setIsEditingOrg: React.Dispatch<React.SetStateAction<boolean>>;
  partnerDetails: PartnerDetails;
  onSave: (updatedDetails: Partial<PartnerDetails>) => Promise<void>;
  isSaving: boolean;
}

export default function InfrastructureServices({
  isEditingOrg,
  setIsEditingOrg,
  partnerDetails,
  onSave,
  isSaving,
}: InfrastructureServicesProps) {
  const [formData, setFormData] = useState({
    facilityDescription: partnerDetails.facilityDescription,
    cleanWaterAccessible: partnerDetails.cleanWaterAccessible,
    cleanWaterDescription: partnerDetails.cleanWaterDescription,
    closestSourceOfCleanWater: partnerDetails.closestSourceOfCleanWater,
    sanitationFacilitiesPresent: partnerDetails.sanitationFacilitiesPresent,
    sanitationFacilitiesLockableFromInside:
      partnerDetails.sanitationFacilitiesLockableFromInside,
    electricityAvailable: partnerDetails.electricityAvailable,
    accessibleByDisablePatients: partnerDetails.accessibleByDisablePatients,
    medicationDisposalProcessDefined:
      partnerDetails.medicationDisposalProcessDefined,
    medicationDisposalProcessDescription:
      partnerDetails.medicationDisposalProcessDescription,
    pickupVehiclePresent: partnerDetails.pickupVehiclePresent,
    pickupVehicleType: partnerDetails.pickupVehicleType,
    pickupLocations: partnerDetails.pickupLocations,
  });

  const handleSave = async () => {
    await onSave(formData);
  };

  const handleCancel = () => {
    setFormData({
      facilityDescription: partnerDetails.facilityDescription,
      cleanWaterAccessible: partnerDetails.cleanWaterAccessible,
      cleanWaterDescription: partnerDetails.cleanWaterDescription,
      closestSourceOfCleanWater: partnerDetails.closestSourceOfCleanWater,
      sanitationFacilitiesPresent: partnerDetails.sanitationFacilitiesPresent,
      sanitationFacilitiesLockableFromInside:
        partnerDetails.sanitationFacilitiesLockableFromInside,
      electricityAvailable: partnerDetails.electricityAvailable,
      accessibleByDisablePatients: partnerDetails.accessibleByDisablePatients,
      medicationDisposalProcessDefined:
        partnerDetails.medicationDisposalProcessDefined,
      medicationDisposalProcessDescription:
        partnerDetails.medicationDisposalProcessDescription,
      pickupVehiclePresent: partnerDetails.pickupVehiclePresent,
      pickupVehicleType: partnerDetails.pickupVehicleType,
      pickupLocations: partnerDetails.pickupLocations,
    });
    setIsEditingOrg(false);
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-bold text-[#2774AE]">
          Infrastructure & Services
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
          Facility Description
        </p>
        {isEditingOrg ? (
          <textarea
            value={formData.facilityDescription}
            onChange={(e) =>
              setFormData({ ...formData, facilityDescription: e.target.value })
            }
            className="border p-1 min-h-[100px]"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.facilityDescription}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Clean Water Accessible
        </p>
        {isEditingOrg ? (
          <select
            value={formData.cleanWaterAccessible.toString()}
            onChange={(e) =>
              setFormData({
                ...formData,
                cleanWaterAccessible: e.target.value === "true",
              })
            }
            className="border p-1"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.cleanWaterAccessible ? "Yes" : "No"}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Electricity Available
        </p>
        {isEditingOrg ? (
          <select
            value={formData.electricityAvailable.toString()}
            onChange={(e) =>
              setFormData({
                ...formData,
                electricityAvailable: e.target.value === "true",
              })
            }
            className="border p-1"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.electricityAvailable ? "Yes" : "No"}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Accessible by Disabled Patients
        </p>
        {isEditingOrg ? (
          <select
            value={formData.accessibleByDisablePatients.toString()}
            onChange={(e) =>
              setFormData({
                ...formData,
                accessibleByDisablePatients: e.target.value === "true",
              })
            }
            className="border p-1"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.accessibleByDisablePatients ? "Yes" : "No"}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Pickup Vehicle Present
        </p>
        {isEditingOrg ? (
          <select
            value={formData.pickupVehiclePresent.toString()}
            onChange={(e) =>
              setFormData({
                ...formData,
                pickupVehiclePresent: e.target.value === "true",
              })
            }
            className="border p-1"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {partnerDetails.pickupVehiclePresent ? "Yes" : "No"}
          </p>
        )}

        {formData.pickupVehiclePresent && (
          <>
            <p className="text-[18px] font-semibold text-[#22070B]">
              Vehicle Type
            </p>
            {isEditingOrg ? (
              <input
                type="text"
                value={formData.pickupVehicleType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pickupVehicleType: e.target.value,
                  })
                }
                className="border p-1"
              />
            ) : (
              <p className="text-[16px] text-[#22070B]">
                {partnerDetails.pickupVehicleType}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

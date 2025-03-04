"use client";

import React from "react";

interface InfrastructureData {
  facilityDescription: string;
  accessToCleanWater: string;
  sanitationFacilities: string;
  electricityAtFacility: string;
  disabledAccess: string;
  medicationDisposalProcess: string;
  vehicleForSupplies: string;
}

interface InfrastructureServicesProps {
  isEditingOrg: boolean;
  setIsEditingOrg: React.Dispatch<React.SetStateAction<boolean>>;
  infrastructureData: InfrastructureData;
  setInfrastructureData: React.Dispatch<
    React.SetStateAction<InfrastructureData>
  >;
}

export default function InfrastructureServices({
  isEditingOrg,
  setIsEditingOrg,
  infrastructureData,
  setInfrastructureData,
}: InfrastructureServicesProps) {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-bold text-[#2774AE]">
          Infrastructure & Services
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
          General description of facility including the type and number of
          buildings
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={infrastructureData.facilityDescription}
            onChange={(e) =>
              setInfrastructureData({
                ...infrastructureData,
                facilityDescription: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {infrastructureData.facilityDescription}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Does your facility provide access to clean water?
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={infrastructureData.accessToCleanWater}
            onChange={(e) =>
              setInfrastructureData({
                ...infrastructureData,
                accessToCleanWater: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {infrastructureData.accessToCleanWater}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Does your facility have sanitation facilities?
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={infrastructureData.sanitationFacilities}
            onChange={(e) =>
              setInfrastructureData({
                ...infrastructureData,
                sanitationFacilities: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {infrastructureData.sanitationFacilities}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Is there electricity at your facility?
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={infrastructureData.electricityAtFacility}
            onChange={(e) =>
              setInfrastructureData({
                ...infrastructureData,
                electricityAtFacility: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {infrastructureData.electricityAtFacility}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Is your facility accessible to disabled patients?
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={infrastructureData.disabledAccess}
            onChange={(e) =>
              setInfrastructureData({
                ...infrastructureData,
                disabledAccess: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {infrastructureData.disabledAccess}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Does your facility have a proper medication disposal process?
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={infrastructureData.medicationDisposalProcess}
            onChange={(e) =>
              setInfrastructureData({
                ...infrastructureData,
                medicationDisposalProcess: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {infrastructureData.medicationDisposalProcess}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Do you have a vehicle to pick up supplies from the depot?
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={infrastructureData.vehicleForSupplies}
            onChange={(e) =>
              setInfrastructureData({
                ...infrastructureData,
                vehicleForSupplies: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {infrastructureData.vehicleForSupplies}
          </p>
        )}
      </div>
    </div>
  );
}

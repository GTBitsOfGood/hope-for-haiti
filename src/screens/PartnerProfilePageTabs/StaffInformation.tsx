"use client";

import React from "react";

interface StaffData {
  numberOfDoctors: string;
  numberOfNurses: string;
  numberOfMidwives: string;
  numberOfAuxiliaries: string;
  numberOfStatisticians: string;
  numberOfPharmacists: string;
  numberOfCHW: string;
  numberOfAdministrative: string;
  numberOfHealthOfficers: string;
  totalNumberOfStaff: string;
  otherStaffNotListed: string;
}

interface StaffInformationProps {
  isEditingOrg: boolean;
  setIsEditingOrg: React.Dispatch<React.SetStateAction<boolean>>;
  staffData: StaffData;
  setStaffData: React.Dispatch<React.SetStateAction<StaffData>>;
}

export default function StaffInformation({
  isEditingOrg,
  setIsEditingOrg,
  staffData,
  setStaffData,
}: StaffInformationProps) {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-bold text-[#2774AE]">
          Staff Information
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
          Number of doctors
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={staffData.numberOfDoctors}
            onChange={(e) =>
              setStaffData({ ...staffData, numberOfDoctors: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {staffData.numberOfDoctors}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of nurses
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={staffData.numberOfNurses}
            onChange={(e) =>
              setStaffData({ ...staffData, numberOfNurses: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {staffData.numberOfNurses}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of midwives
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={staffData.numberOfMidwives}
            onChange={(e) =>
              setStaffData({ ...staffData, numberOfMidwives: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {staffData.numberOfMidwives}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of auxiliaries
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={staffData.numberOfAuxiliaries}
            onChange={(e) =>
              setStaffData({
                ...staffData,
                numberOfAuxiliaries: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {staffData.numberOfAuxiliaries}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of statisticians
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={staffData.numberOfStatisticians}
            onChange={(e) =>
              setStaffData({
                ...staffData,
                numberOfStatisticians: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {staffData.numberOfStatisticians}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of pharmacists
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={staffData.numberOfPharmacists}
            onChange={(e) =>
              setStaffData({
                ...staffData,
                numberOfPharmacists: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {staffData.numberOfPharmacists}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of CHW
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={staffData.numberOfCHW}
            onChange={(e) =>
              setStaffData({ ...staffData, numberOfCHW: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">{staffData.numberOfCHW}</p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of administrative
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={staffData.numberOfAdministrative}
            onChange={(e) =>
              setStaffData({
                ...staffData,
                numberOfAdministrative: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {staffData.numberOfAdministrative}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Number of health officers
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={staffData.numberOfHealthOfficers}
            onChange={(e) =>
              setStaffData({
                ...staffData,
                numberOfHealthOfficers: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {staffData.numberOfHealthOfficers}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Total number of staff
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={staffData.totalNumberOfStaff}
            onChange={(e) =>
              setStaffData({ ...staffData, totalNumberOfStaff: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {staffData.totalNumberOfStaff}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Other staff not listed
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={staffData.otherStaffNotListed}
            onChange={(e) =>
              setStaffData({
                ...staffData,
                otherStaffNotListed: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {staffData.otherStaffNotListed}
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { User } from "@prisma/client";
import GeneralInfo from "./PartnerProfilePageTabs/GeneralInfo";
import ContactInformation from "./PartnerProfilePageTabs/ContactInformation";
import Introduction from "./PartnerProfilePageTabs/Introduction";
import FacilityInformation from "./PartnerProfilePageTabs/FacilityInformation";
import InfrastructureServices from "./PartnerProfilePageTabs/InfrastructureServices";
import ProgramServices from "./PartnerProfilePageTabs/ProgramServices";
import Finances from "./PartnerProfilePageTabs/Finances";
import StaffInformation from "./PartnerProfilePageTabs/StaffInformation";

interface PartnerProfileScreenProps {
  user: User;
}

const TABS: string[] = [
  "General information",
  "Contact information",
  "Introduction",
  "Facility Information",
  "Infrastructure & Services",
  "Programs & Services Provided",
  "Finances",
  "Staff Information",
];

export default function ProfileScreenPartner({
  user,
}: PartnerProfileScreenProps) {
  const [activeTab, setActiveTab] = useState("General information");
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isEditingOrg, setIsEditingOrg] = useState(false);

  const [userData, setUserData] = useState({
    email: "example@gmail.com",
    password: "********",
  });

  useEffect(() => {
    setUserData({
      email: user.email,
      password: "********",
    });
  }, [user]);

  const [orgData, setOrgData] = useState({
    siteName: "partner org name",
    address: "123-456-7890",
    department: "123 address somewhere street",
    gpsCoordinates: "123 address somewhere street",
    website: "60",
    socialMedia: "Nonprofit",
  });

  const [contactData, setContactData] = useState({
    regionalContact: "name",
    medicalContact: "name",
    adminDirector: "name",
    pharmacy: "name",
    whatsAppContact: "60",
    whatsAppNumber: "60",
  });

  const [introductionData, setIntroductionData] = useState({
    organizationHistory: "partner org name",
    typeOfSupportRequested: "123-456-7890",
    dateEstablished: "123 address somewhere street",
    isRegisteredWithMSSP: "123 address somewhere street",
    programUpdatesSinceLastReport: "60",
  });

  const [facilityData, setFacilityData] = useState({
    typeOfFacility: "partner org name",
    governmentRunOrganization: "123 address somewhere street",
    hasEMRSystem: "123 address somewhere street",
    numberOfInpatientBeds: "60",
    numberOfPatientsServedAnnually: "Nonprofit",
    communityMobileOutreach: "Nonprofit",
  });

  const [infrastructureData, setInfrastructureData] = useState({
    facilityDescription: "partner org name",
    accessToCleanWater: "123-456-7890",
    sanitationFacilities: "123 address somewhere street",
    electricityAtFacility: "123 address somewhere street",
    disabledAccess: "60",
    medicationDisposalProcess: "Nonprofit",
    vehicleForSupplies: "Nonprofit",
  });

  const [programServicesData, setProgramServicesData] = useState({
    medicalServicesProvided: "partner org name",
    otherServicesProvided: "123-456-7890",
  });

  const [financesData, setFinancesData] = useState({
    whatHappensPatientsCannotPay: "partner org name",
    percentageNeedingFinancialAid: "123-456-7890",
    percentageReceivingFreeTreatment: "123 address somewhere street",
    annualSpendingMedications: "123 address somewhere street",
    trackPrescriptionsEachYear: "60",
    totalNumberOfTreatmentsAnnually: "Nonprofit",
    numberOfPatientsServedLastYear: "Nonprofit",
  });

  const [staffData, setStaffData] = useState({
    numberOfDoctors: "partner org name",
    numberOfNurses: "123-456-7890",
    numberOfMidwives: "123 address somewhere street",
    numberOfHealthOfficers: "Nonprofit",
    numberOfStatisticians: "60",
    numberOfPharmacists: "Nonprofit",
    numberOfCHW: "Nonprofit",
    numberOfAdministrative: "Nonprofit",
    numberOfAuxiliaries: "123 address somewhere street",
    otherStaffNotListed: "Nonprofit",
    totalNumberOfStaff: "Nonprofit",
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 font-[Open_Sans]">
      <h1 className="text-[32px] font-bold leading-[40px] text-[#22070B]">
        Profile
      </h1>

      <div className="mt-6">
        <div className="flex justify-between items-center">
          <h2 className="text-[20px] font-bold leading-[28px] text-[#22070B]">
            User
          </h2>
          <button
            onClick={() => setIsEditingUser(!isEditingUser)}
            className="border border-mainRed text-mainRed px-4 py-2 rounded-[4px] font-semibold hover:bg-mainRed/10"
          >
            {isEditingUser ? "Save" : "Edit"}
          </button>
        </div>
        <hr className="mb-4 mt-1 border-gray-300" />

        <div className="grid grid-cols-2 gap-4 max-w-xl">
          <p className="text-[18px] font-semibold text-[#22070B]">Email</p>
          {isEditingUser ? (
            <input
              type="text"
              value={userData.email}
              onChange={(e) =>
                setUserData({ ...userData, email: e.target.value })
              }
              className="border p-1"
            />
          ) : (
            <p className="text-[16px] text-[#22070B]">{userData.email}</p>
          )}

          <p className="text-[18px] font-semibold text-[#22070B]">Password</p>
          {isEditingUser ? (
            <input
              type="text"
              value={userData.password}
              onChange={(e) =>
                setUserData({ ...userData, password: e.target.value })
              }
              className="border p-1"
            />
          ) : (
            <p className="text-[16px] text-[#22070B]">{userData.password}</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-[20px] font-bold leading-[28px] text-[#22070B] mt-10">
          Organization
        </h2>
        <hr className="border-gray-300 mb-6 mt-1" />

        <div className="flex mt-1 border-b border-gray-300">
          {TABS.map((tab: string) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1 text-[16px] font-semibold transition-colors ${
                  isActive
                    ? "text-[#2774AE] border-b-2 border-[#2774AE]"
                    : "text-[#22070B]/70"
                } hover:bg-[#2774AE]/10`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {activeTab === "General information" && (
          <GeneralInfo
            isEditingOrg={isEditingOrg}
            setIsEditingOrg={setIsEditingOrg}
            orgData={orgData}
            setOrgData={setOrgData}
          />
        )}
        {activeTab === "Contact information" && (
          <ContactInformation
            isEditingOrg={isEditingOrg}
            setIsEditingOrg={setIsEditingOrg}
            contactData={contactData}
            setContactData={setContactData}
          />
        )}
        {activeTab === "Introduction" && (
          <Introduction
            isEditingOrg={isEditingOrg}
            setIsEditingOrg={setIsEditingOrg}
            introductionData={introductionData}
            setIntroductionData={setIntroductionData}
          />
        )}
        {activeTab === "Facility Information" && (
          <FacilityInformation
            isEditingOrg={isEditingOrg}
            setIsEditingOrg={setIsEditingOrg}
            facilityData={facilityData}
            setFacilityData={setFacilityData}
          />
        )}
        {activeTab === "Infrastructure & Services" && (
          <InfrastructureServices
            isEditingOrg={isEditingOrg}
            setIsEditingOrg={setIsEditingOrg}
            infrastructureData={infrastructureData}
            setInfrastructureData={setInfrastructureData}
          />
        )}
        {activeTab === "Programs & Services Provided" && (
          <ProgramServices
            isEditingOrg={isEditingOrg}
            setIsEditingOrg={setIsEditingOrg}
            programServicesData={programServicesData}
            setProgramServicesData={setProgramServicesData}
          />
        )}
        {activeTab === "Finances" && (
          <Finances
            isEditingOrg={isEditingOrg}
            setIsEditingOrg={setIsEditingOrg}
            financesData={financesData}
            setFinancesData={setFinancesData}
          />
        )}
        {activeTab === "Staff Information" && (
          <StaffInformation
            isEditingOrg={isEditingOrg}
            setIsEditingOrg={setIsEditingOrg}
            staffData={staffData}
            setStaffData={setStaffData}
          />
        )}
      </div>
    </div>
  );
}

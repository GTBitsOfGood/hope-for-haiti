"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { useFetch } from "@/hooks/useFetch";
import { useApiClient } from "@/hooks/useApiClient";
import { PartnerDetails } from "@/schema/partnerDetails";
import PartnerDetailsSection from "@/components/PartnerDetails/PartnerDetailsSection";
import { tabOrder } from "@/components/PartnerDetails/fieldConfigs";

interface PartnerProfileScreenProps {
  user: User;
}

const defaultPartnerDetails: PartnerDetails = {
  siteName: "",
  address: "",
  department: "",
  gpsCoordinates: "",
  website: "",
  socialMedia: "",

  regionalContact: {
    firstName: "",
    lastName: "",
    orgTitle: "",
    primaryTelephone: "",
    secondaryTelephone: "",
    email: "",
  },
  medicalContact: {
    firstName: "",
    lastName: "",
    orgTitle: "",
    primaryTelephone: "",
    secondaryTelephone: "",
    email: "",
  },
  adminDirectorContact: {
    firstName: "",
    lastName: "",
    orgTitle: "",
    primaryTelephone: "",
    secondaryTelephone: "",
    email: "",
  },
  pharmacyContact: {
    firstName: "",
    lastName: "",
    orgTitle: "",
    primaryTelephone: "",
    secondaryTelephone: "",
    email: "",
  },
  contactWhatsAppName: "",
  contactWhatsAppNumber: "",

  organizationHistory: "",
  supportRequested: "ongoing_support",
  yearOrganizationEstablished: new Date().getFullYear(),
  registeredWithMssp: false,
  proofOfRegistrationWithMssp: "",
  programUpdatesSinceLastReport: "",

  facilityType: [],
  organizationType: [],
  governmentRun: false,
  emergencyMedicalRecordsSystemPresent: false,
  emergencyMedicalRecordsSystemName: "",
  numberOfInpatientBeds: 0,
  numberOfPatientsServedAnnually: 0,
  communityMobileOutreachOffered: false,
  communityMobileOutreachDescription: "",

  facilityDescription: "",
  cleanWaterAccessible: false,
  cleanWaterDescription: "",
  closestSourceOfCleanWater: "",
  sanitationFacilitiesPresent: false,
  sanitationFacilitiesLockableFromInside: false,
  electricityAvailable: false,
  accessibleByDisablePatients: false,
  medicationDisposalProcessDefined: false,
  medicationDisposalProcessDescription: "",
  pickupVehiclePresent: false,
  pickupVehicleType: "",
  pickupLocations: [],

  medicalServicesProvided: [],
  otherMedicalServicesProvided: "",

  patientsWhoCannotPay: "",
  percentageOfPatientsNeedingFinancialAid: 0,
  percentageOfPatientsReceivingFreeTreatment: 0,
  annualSpendingOnMedicationsAndMedicalSupplies: "1_to_5000",
  numberOfPrescriptionsPrescribedAnnuallyTracked: false,
  numberOfTreatmentsPrescribedAnnually: 0,
  anyMenServedLastYear: false,
  menServedLastYear: 0,
  anyWomenServedLastYear: false,
  womenServedLastYear: 0,
  anyBoysServedLastYear: false,
  boysServedLastYear: 0,
  anyGirlsServedLastYear: false,
  girlsServedLastYear: 0,
  anyBabyBoysServedLastYear: false,
  babyBoysServedLastYear: 0,
  anyBabyGirlsServedLastYear: false,
  babyGirlsServedLastYear: 0,
  totalPatientsServedLastYear: 0,

  numberOfDoctors: 0,
  numberOfNurses: 0,
  numberOfMidwives: 0,
  numberOfAuxilaries: 0,
  numberOfStatisticians: 0,
  numberOfPharmacists: 0,
  numberOfCHW: 0,
  numberOfAdministrative: 0,
  numberOfHealthOfficers: 0,
  totalNumberOfStaff: 0,
  other: "",

  mostNeededMedicalSupplies: [],
  otherSpecialityItemsNeeded: "",
};

export default function ProfileScreenPartner({
  user,
}: PartnerProfileScreenProps) {
  const [activeTab, setActiveTab] = useState("General information");
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fileUploads, setFileUploads] = useState<Record<string, File>>({});

  const {
    data: partnerDetails,
    isLoading,
    error,
    refetch,
  } = useFetch<PartnerDetails>(`/api/partnerDetails/${user.id}`, {
    onError: (error) => {
      console.error("Failed to load partner details:", error);
    },
  });

  const { apiClient } = useApiClient();

  const currentPartnerDetails = partnerDetails || defaultPartnerDetails;

  const [userData, setUserData] = useState({
    email: user.email,
    password: "********",
  });

  const handleFileChange = (name: string, file: File | null) => {
    setFileUploads((prev) => {
      const updated = { ...prev };
      if (file) {
        updated[name] = file;
      } else {
        delete updated[name];
      }
      return updated;
    });
  };

  const handleSavePartnerDetails = async (
    updatedDetails: Partial<PartnerDetails>
  ) => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      const updatedPartnerDetails = {
        ...currentPartnerDetails,
        ...updatedDetails,
      };

      Object.keys(fileUploads).forEach((fieldName) => {
        const file = fileUploads[fieldName];
        if (file) {
          (updatedPartnerDetails as Record<string, unknown>)[fieldName] =
            file.name;
        }
      });

      if (!updatedPartnerDetails.registeredWithMssp) {
        updatedPartnerDetails.proofOfRegistrationWithMssp = "";
      }

      const formData = new FormData();
      formData.append("partnerDetails", JSON.stringify(updatedPartnerDetails));

      Object.keys(fileUploads).forEach((fieldName) => {
        const file = fileUploads[fieldName];
        if (file) {
          formData.append(fieldName, file);
        }
      });

      await apiClient.post(`/api/partnerDetails/${user.id}`, {
        body: formData,
      });

      refetch();
      setIsEditingOrg(false);
      setFileUploads({});
    } catch (error) {
      console.error("Failed to save partner details:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-6 font-[Open_Sans]">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading partner details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-6 font-[Open_Sans]">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-600">
            Error loading partner details: {error}
          </div>
          <button
            onClick={() => refetch()}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
          {tabOrder.map((tab: string) => {
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

        {/* Render the active tab using the unified PartnerDetailsSection */}
        <PartnerDetailsSection
          sectionName={activeTab}
          partnerDetails={currentPartnerDetails}
          onSave={handleSavePartnerDetails}
          isEditing={isEditingOrg}
          setIsEditing={setIsEditingOrg}
          isSaving={isSaving}
          mode="view"
          onFileChange={handleFileChange}
        />
      </div>
    </div>
  );
}

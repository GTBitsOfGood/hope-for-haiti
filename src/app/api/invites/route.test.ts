import { dbMock } from "@/test/dbMock";

import { testApiHandler } from "next-test-api-route-handler";
import { expect, test } from "@jest/globals";
import { UserType } from "@prisma/client";
import * as uuid from "uuid";

import { authMock } from "@/test/authMock";
import { sendEmailMock } from "@/test/emailMock";

import * as appHandler from "./route";

test("requires session", async () => {
  await testApiHandler({
    appHandler,

    async test({ fetch }) {
      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "ADMIN");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(401);
    },
  });
});

test("requires SUPER_ADMIN user type", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "ADMIN" },
        expires: "",
      });

      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "ADMIN");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(403);
    },
  });
});

test("email is validated correctly", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "SUPER_ADMIN" },
        expires: "",
      });

      const formData = new FormData();
      formData.append("email", "invalidemail");
      formData.append("userType", "ADMIN");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(400);
    },
  });
});

test("userType is validated correctly", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "SUPER_ADMIN" },
        expires: "",
      });

      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "INVALID_TYPE");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(400);
    },
  });
});

test("check existing user", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "SUPER_ADMIN" },
        expires: "",
      });

      dbMock.user.findFirst.mockResolvedValue({
        id: 1,
        email: "test@test.com",
        name: "name",
        type: UserType.ADMIN,
        passwordHash: "abc",
        partnerDetails: null,
        enabled: true,
      });

      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "ADMIN");
      formData.append("name", "test name");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(409);
    },
  });
});

test("test email html", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "SUPER_ADMIN" },
        expires: "",
      });

      sendEmailMock.mockImplementation(async () => {});

      const uuidMock = jest.spyOn(uuid, "v4");
      const mockToken = "mocked-uuid-token";
      // @ts-expect-error: jest cannot deal with overloaded functions
      uuidMock.mockReturnValueOnce(mockToken);

      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "ADMIN");
      formData.append("name", "test name");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(200);

      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.stringMatching(new RegExp(`register\\?token=${mockToken}`))
      );
    },
  });
});

test("UserInvite expires in one day", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "SUPER_ADMIN" },
        expires: "",
      });

      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "ADMIN");
      formData.append("name", "test name");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(200);

      const createdInvite = dbMock.userInvite.create.mock.calls[0][0].data;
      const expirationDate = new Date(createdInvite.expiration);
      const currentDate = new Date();
      const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

      expect(expirationDate.getTime() - currentDate.getTime()).toBeCloseTo(
        oneDayInMilliseconds,
        -2
      );
    },
  });
});

test("verify sendEmail call", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "SUPER_ADMIN" },
        expires: "",
      });

      sendEmailMock.mockImplementation(async () => {});

      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "ADMIN");
      formData.append("name", "test name");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(200);

      expect(sendEmailMock).toHaveBeenCalled();
    },
  });
});

test("error when missing partner details for partner invite", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "SUPER_ADMIN" },
        expires: "",
      });

      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "PARTNER");
      formData.append("name", "test name");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(400);
    },
  });
});

test("error when invalid partner details for partner invite", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "SUPER_ADMIN" },
        expires: "",
      });

      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "PARTNER");
      formData.append("name", "test name");
      formData.append(
        "partnerDetails",
        JSON.stringify({
          siteName: 8,
        })
      );
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(400);
    },
  });
});

// TODO fix
test.skip("success when valid partner details for partner invite", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "SUPER_ADMIN" },
        expires: "",
      });

      const testContact = {
        firstName: "test_firstName",
        lastName: "test_lastName",
        orgTitle: "test_orgTitle",
        primaryTelephone: "test_primaryTelephone",
        secondaryTelephone: "test_secondaryTelephone",
      };

      const partnerDetails = {
        // General
        siteName: "test_siteName",
        address: "test_address",
        department: "test_department",
        gpsCoordinates: "test_gpsCoordinates",
        website: "test_website",
        socialMedia: "test_socialMedia",

        // Contact
        regionalContact: testContact,
        medicalContact: testContact,
        adminDirectorContact: testContact,
        pharmacyContact: testContact,
        contactWhatsAppName: "test_contactWhatsAppName",
        contactWhatsAppNumber: "test_contactWhatsAppNumber",

        // Introduction
        organizationHistory: "test_organizationHistory",
        supportRequested: "mobile_clinic_support",
        yearOrganizationEstablished: 2025,
        registeredWithMssp: true,
        proofOfRegistationWithMssp: "https://www.google.com/", // this is a URL to the file upload
        programUpdatesSinceLastReport: "test_programUpdatesSinceLastReport",

        // Facility
        facilityType: [
          "birthing_center",
          "clinic",
          "hospital",
          "elderly_care",
          "rehabilitation_center",
          "dispensary",
          "orphanage",
          "primary_care",
          "health_center",
          "community_health_education",
          "nutrition_feeding",
          "secondary_tertiary_healthcare",
        ],
        organizationType: ["non_profit", "for_profit", "faith_based"],
        governmentRun: true,
        emergencyMedicalRecordsSystemPresent: true,
        emergencyMedicalRecordsSystemName: "test",
        numberOfInpatientBeds: 10,
        numberOfPatientsServedAnnually: 10,
        communityMobileOutreachOffered: true,
        communityMobileOutreachDescription: "test",

        // Infrastructure and Services
        facilityDescription: "test",
        cleanWaterAccessible: true,
        cleanWaterDescription: "test",
        closestSourceOfCleanWater: "test",
        sanitationFacilitiesPresent: true,
        sanitationFacilitiesLockableFromInside: true,
        electricityAvailable: true,
        accessibleByDisablePatients: true,
        medicationDisposalProcessDefined: true,
        medicationDisposalProcessDescription: "test",
        pickupVehiclePresent: true,
        pickupVehicleType: "test",
        pickupLocations: ["les_cayes", "port_au_prince"],

        // Programs and Services Provided
        medicalServicesProvided: [
          "cancer",
          "dentistry",
          "dermatology",
          "hematology",
          "immunizations",
          "parasitic_infections",
          "acute_respiratory_infections",
          "vector_borne_diseases",
          "chronic_diseases",
          "diarrheal_diseases",
          "vaccine_preventable_diseases",
          "infectious_diseases",
          "neurology",
          "malnutrition",
          "ophthalmology",
          "ears_nose_throat",
          "orthopedics_and_rehabilitation",
          "pediatrics",
          "radiology",
          "wound_care",
          "maternal_care",
          "lab_tests",
          "trauma_and_surgery",
          "urology",
        ],
        otherMedicalServicesProvided: "test",

        // Finances
        patientsWhoCannotPay: "test",
        percentageOfPatientsNeedingFinancialAid: 10,
        percentageOfPatientsReceivingFreeTreatment: 10,
        annualSpendingOnMedicationsAndMedicalSupplies: "5001_to_10000",
        numberOfPrescriptionsPrescribedAnnuallyTracked: true,
        numberOfTreatmentsPrescribedAnnually: 10,
        anyMenServedLastYear: true,
        menServedLastYear: 10,
        anyWomenServedLastYear: true,
        womenServedLastYear: 10,
        anyBoysServedLastYear: true,
        boysServedLastYear: 10,
        anyGirlsServedLastYear: true,
        girlsServedLastYear: 10,
        anyBabyBoysServedLastYear: true,
        babyBoysServedLastYear: 10,
        anyBabyGirlsServedLastYear: true,
        babyGirlsServedLastYear: 10,
        totalPatientsServedLastYear: 10,

        // Staff
        numberOfDoctors: 10,
        numberOfNurses: 10,
        numberOfMidwives: 10,
        numberOfAuxilaries: 10,
        numberOfStatisticians: 10,
        numberOfPharmacists: 10,
        numberOfCHW: 10,
        numberOfAdministrative: 10,
        numberOfHealthOfficers: 10,
        totalNumberOfStaff: 10,
        other: "test",

        // Medical Supplies
        mostNeededMedicalSupplies: [
          "anesthetics",
          "antipyretics_nsaids",
          "antiallergics",
          "anti_infectives",
          "antineoplastics",
          "cardiovascular",
          "dermatological",
          "diagnostics",
          "diuretics",
          "gastrointestinal",
          "ophthalmological",
          "respiratory",
          "replacements",
          "vitamins_minerals",
          "bandages",
          "braces",
          "hospital_consumables",
          "dental",
          "diagnostic",
          "personal_care",
          "Prosthetics",
          "respiratory ",
          "surgical ",
          "syringes_needles",
        ],
        otherSpecialityItemsNeeded: "test",
      };

      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "PARTNER");
      formData.append("name", "test name");
      formData.append("partnerDetails", JSON.stringify(partnerDetails));
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(200);

      const createdInvite = dbMock.userInvite.create.mock.calls[0][0].data;
      expect(createdInvite.partnerDetails).toEqual(partnerDetails);
    },
  });
});

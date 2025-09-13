// /* eslint-disable @typescript-eslint/no-explicit-any */
// //Lint gets angry when "as any" is used, but it is necessary for mocking Prisma responses using the "select" parameter (for now).
// import { dbMock } from "@/test/dbMock";

// import { testApiHandler } from "next-test-api-route-handler";
// import * as appHandler from "./route";

// import { expect, test } from "@jest/globals";
// import { authMock } from "@/test/authMock";
// import { UserType } from "@prisma/client";

// const getValidPartnerDetails = () => {
//   const testContact = {
//     firstName: "test_firstName",
//     lastName: "test_lastName",
//     orgTitle: "test_orgTitle",
//     primaryTelephone: "test_primaryTelephone",
//     secondaryTelephone: "test_secondaryTelephone",
//   };

//   const partnerDetails = {
//     // General
//     siteName: "test_siteName",
//     address: "test_address",
//     department: "test_department",
//     gpsCoordinates: "test_gpsCoordinates",
//     website: "test_website",
//     socialMedia: "test_socialMedia",

//     // Contact
//     regionalContact: testContact,
//     medicalContact: testContact,
//     adminDirectorContact: testContact,
//     pharmacyContact: testContact,
//     contactWhatsAppName: "test_contactWhatsAppName",
//     contactWhatsAppNumber: "test_contactWhatsAppNumber",

//     // Introduction
//     organizationHistory: "test_organizationHistory",
//     supportRequested: "mobile_clinic_support",
//     yearOrganizationEstablished: 2025,
//     registeredWithMssp: true,
//     proofOfRegistrationWithMssp: "https://www.google.com/", // this is a URL to the file upload
//     programUpdatesSinceLastReport: "test_programUpdatesSinceLastReport",

//     // Facility
//     facilityType: [
//       "birthing_center",
//       "clinic",
//       "hospital",
//       "elderly_care",
//       "rehabilitation_center",
//       "dispensary",
//       "orphanage",
//       "primary_care",
//       "health_center",
//       "community_health_education",
//       "nutrition_feeding",
//       "secondary_tertiary_healthcare",
//     ],
//     organizationType: ["non_profit", "for_profit", "faith_based"],
//     governmentRun: true,
//     emergencyMedicalRecordsSystemPresent: true,
//     emergencyMedicalRecordsSystemName: "test",
//     numberOfInpatientBeds: 10,
//     numberOfPatientsServedAnnually: 10,
//     communityMobileOutreachOffered: true,
//     communityMobileOutreachDescription: "test",

//     // Infrastructure and Services
//     facilityDescription: "test",
//     cleanWaterAccessible: true,
//     cleanWaterDescription: "test",
//     closestSourceOfCleanWater: "test",
//     sanitationFacilitiesPresent: true,
//     sanitationFacilitiesLockableFromInside: true,
//     electricityAvailable: true,
//     accessibleByDisablePatients: true,
//     medicationDisposalProcessDefined: true,
//     medicationDisposalProcessDescription: "test",
//     pickupVehiclePresent: true,
//     pickupVehicleType: "test",
//     pickupLocations: ["les_cayes", "port_au_prince"],

//     // Programs and Services Provided
//     medicalServicesProvided: [
//       "cancer",
//       "dentistry",
//       "dermatology",
//       "hematology",
//       "immunizations",
//       "parasitic_infections",
//       "acute_respiratory_infections",
//       "vector_borne_diseases",
//       "chronic_diseases",
//       "diarrheal_diseases",
//       "vaccine_preventable_diseases",
//       "infectious_diseases",
//       "neurology",
//       "malnutrition",
//       "ophthalmology",
//       "ears_nose_throat",
//       "orthopedics_and_rehabilitation",
//       "pediatrics",
//       "radiology",
//       "wound_care",
//       "maternal_care",
//       "lab_tests",
//       "trauma_and_surgery",
//       "urology",
//     ],
//     otherMedicalServicesProvided: "test",

//     // Finances
//     patientsWhoCannotPay: "test",
//     percentageOfPatientsNeedingFinancialAid: 10,
//     percentageOfPatientsReceivingFreeTreatment: 10,
//     annualSpendingOnMedicationsAndMedicalSupplies: "5001_to_10000",
//     numberOfPrescriptionsPrescribedAnnuallyTracked: true,
//     numberOfTreatmentsPrescribedAnnually: 10,
//     anyMenServedLastYear: true,
//     menServedLastYear: 10,
//     anyWomenServedLastYear: true,
//     womenServedLastYear: 10,
//     anyBoysServedLastYear: true,
//     boysServedLastYear: 10,
//     anyGirlsServedLastYear: true,
//     girlsServedLastYear: 10,
//     anyBabyBoysServedLastYear: true,
//     babyBoysServedLastYear: 10,
//     anyBabyGirlsServedLastYear: true,
//     babyGirlsServedLastYear: 10,
//     totalPatientsServedLastYear: 10,

//     // Staff
//     numberOfDoctors: 10,
//     numberOfNurses: 10,
//     numberOfMidwives: 10,
//     numberOfAuxilaries: 10,
//     numberOfStatisticians: 10,
//     numberOfPharmacists: 10,
//     numberOfCHW: 10,
//     numberOfAdministrative: 10,
//     numberOfHealthOfficers: 10,
//     totalNumberOfStaff: 10,
//     other: "test",

//     // Medical Supplies
//     mostNeededMedicalSupplies: [
//       "anesthetics",
//       "antipyretics_nsaids",
//       "antiallergics",
//       "anti_infectives",
//       "antineoplastics",
//       "cardiovascular",
//       "dermatological",
//       "diagnostics",
//       "diuretics",
//       "gastrointestinal",
//       "ophthalmological",
//       "respiratory",
//       "replacements",
//       "vitamins_minerals",
//       "bandages",
//       "braces",
//       "hospital_consumables",
//       "dental",
//       "diagnostic",
//       "personal_care",
//       "Prosthetics",
//       "respiratory ",
//       "surgical ",
//       "syringes_needles",
//     ],
//     otherSpecialityItemsNeeded: "test",
//   };
//   return partnerDetails;
// };

// const getPartnerDetailsFormData = () => {
//   const formData = new FormData();
//   formData.append("partnerDetails", JSON.stringify(getValidPartnerDetails()));
//   return formData;
// };

// test("returns 401 on invalid session", async () => {
//   await testApiHandler({
//     appHandler,
//     paramsPatcher: (params) => ({ ...params, userId: "1234" }),
//     async test({ fetch }) {
//       // Mock invalid session
//       authMock.mockReturnValueOnce(null);

//       const res = await fetch({ method: "GET", body: null });
//       await expect(res.status).toBe(401);
//       await expect(res.json()).resolves.toStrictEqual({
//         message: "Session required",
//       });
//     },
//   });
// });

// test("returns 403 on unauthorized", async () => {
//   await testApiHandler({
//     appHandler,
//     paramsPatcher: (params) => ({ ...params, userId: "1234" }),
//     async test({ fetch }) {
//       // User id different from session user id
//       authMock.mockReturnValueOnce({
//         user: { id: "4321", type: UserType.PARTNER },
//         expires: "",
//       });

//       const res = await fetch({ method: "GET", body: null });
//       await expect(res.status).toBe(403);
//       await expect(res.json()).resolves.toStrictEqual({
//         message: "You are not allowed to view this",
//       });
//     },
//   });
// });

// test("returns 404 on not found", async () => {
//   await testApiHandler({
//     appHandler,
//     paramsPatcher: (params) => ({ ...params, userId: "1234" }),
//     async test({ fetch }) {
//       authMock.mockReturnValueOnce({
//         user: { id: "1234", type: UserType.PARTNER },
//         expires: "",
//       });

//       // Mock record not found
//       dbMock.user.findUnique.mockResolvedValueOnce(null);

//       const res = await fetch({ method: "GET", body: null });
//       await expect(res.status).toBe(404);
//       await expect(res.json()).resolves.toStrictEqual({
//         message: "Partner details not found",
//       });
//     },
//   });
// });

// test("returns 200 and correct details on success when partner + id matches", async () => {
//   await testApiHandler({
//     appHandler,
//     paramsPatcher: (params) => ({ ...params, userId: "1234" }),
//     async test({ fetch }) {
//       authMock.mockReturnValueOnce({
//         user: { id: "1234", type: UserType.PARTNER },
//         expires: "",
//       });

//       // Mock return for partner details
//       dbMock.user.findUnique.mockResolvedValueOnce({
//         partnerDetails: getValidPartnerDetails(),
//         type: "PARTNER",
//         id: 0,
//         email: "test_email@test.com",
//         name: "tester",
//         passwordHash: "test_hash",
//         enabled: true,
//       });

//       const res = await fetch({ method: "GET", body: null });
//       await expect(res.status).toBe(200);
//       await expect(res.json()).resolves.toStrictEqual(getValidPartnerDetails());
//     },
//   });
// });

// test("returns 200 and correct details on success when staff matches", async () => {
//   await testApiHandler({
//     appHandler,
//     paramsPatcher: (params) => ({ ...params, userId: "1234" }),
//     async test({ fetch }) {
//       authMock.mockReturnValueOnce({
//         user: { id: "1111", type: UserType.STAFF },
//         expires: "",
//       });

//       // Mock return for partner details
//       dbMock.user.findUnique.mockResolvedValueOnce({
//         partnerDetails: getValidPartnerDetails(),
//         type: "PARTNER",
//         id: 0,
//         email: "test_email@test.com",
//         name: "tester",
//         passwordHash: "test_hash",
//         enabled: true,
//       });

//       const res = await fetch({ method: "GET", body: null });
//       await expect(res.status).toBe(200);
//       await expect(res.json()).resolves.toStrictEqual(getValidPartnerDetails());
//     },
//   });
// });

// describe("POST /api/partnerDetails/[userId]", () => {
//   // No Valid Session (401)
//   test("returns 401 when there is no valid session", async () => {
//     authMock.mockReturnValueOnce(null); //no valid session

//     await testApiHandler({
//       appHandler,
//       params: { userId: "1" },
//       async test({ fetch }) {
//         const res = await fetch({
//           method: "POST",
//           body: getPartnerDetailsFormData(),
//         });

//         expect(res.status).toBe(401);
//         const json = await res.json();
//         expect(json).toEqual({ message: "Session required" });
//       },
//     });
//   });

//   // PARTNER user tries to modify another user's details (session user ID does not match the request user ID) (403)
//   test("returns 403 when a PARTNER user tries to modify another user's record", async () => {
//     authMock.mockReturnValueOnce({
//       user: { id: "1", type: "PARTNER" },
//       expires: "",
//     });

//     await testApiHandler({
//       appHandler,
//       params: { userId: "2" }, //different user
//       async test({ fetch }) {
//         const res = await fetch({
//           method: "POST",
//           body: getPartnerDetailsFormData(),
//         });

//         expect(res.status).toBe(403);
//         const json = await res.json();
//         expect(json).toEqual({
//           message: "You are not allowed to modify this record",
//         });
//       },
//     });
//   });

//   // Invalid Form Data (400)
//   test("returns 400 when the form data is invalid", async () => {
//     authMock.mockReturnValueOnce({
//       user: { id: "1", type: "SUPER_ADMIN" },
//       expires: "",
//     });

//     // missing numberOfPatients
//     const formData = new FormData();
//     formData.append("organizationType", "NON_PROFIT");

//     await testApiHandler({
//       appHandler,
//       params: { userId: "1" },
//       async test({ fetch }) {
//         const res = await fetch({
//           method: "POST",
//           body: formData,
//         });

//         expect(res.status).toBe(400);
//         const json = await res.json();
//         expect(json).toEqual({ message: "Invalid form data" });
//       },
//     });
//   });

//   // Valid Request (200)
//   test.skip("updates PartnerDetails and returns 200 for a valid request", async () => {
//     authMock.mockReturnValueOnce({
//       user: { id: "1", type: "SUPER_ADMIN" },
//       expires: "",
//     });

//     const updatedPartnerDetails = getValidPartnerDetails();

//     const updatedUser = {
//       id: 1,
//       email: "test_email",
//       name: "test_name",
//       passwordHash: "test_hash",
//       type: UserType.SUPER_ADMIN,
//       partnerDetails: updatedPartnerDetails,
//       enabled: true,
//     };

//     dbMock.user.update.mockResolvedValueOnce(updatedUser);

//     await testApiHandler({
//       appHandler,
//       params: { userId: "1" },
//       async test({ fetch }) {
//         const res = await fetch({
//           method: "POST",
//           body: getPartnerDetailsFormData(),
//         });

//         expect(res.status).toBe(200);
//         const json = await res.json();
//         expect(json).toEqual(updatedPartnerDetails);
//       },
//     });
//   });
// });

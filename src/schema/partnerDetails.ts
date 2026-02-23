import * as z from "zod";

const contactSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  orgTitle: z.string(),
  primaryTelephone: z.string(),
  secondaryTelephone: z.string().optional(),
  email: z.string().email(),
});

export const partnerDetailsSchema = z
  .object({
    // General
    siteName: z.string(),
    address: z.string(),
    department: z.string(),
    gpsCoordinates: z.string().optional(),
    website: z.string().optional(),
    socialMedia: z.string().optional(),

    // Contact
    regionalContact: contactSchema,
    medicalContact: contactSchema,
    adminDirectorContact: contactSchema,
    pharmacyContact: contactSchema,
    contactWhatsAppName: z.string().optional(),
    contactWhatsAppNumber: z.string().optional(),

    // Introduction
    organizationHistory: z.string(),
    supportRequested: z.enum([
      "ongoing_support",
      "mobile_clinic_support",
      "one_time_request",
      "project_support",
    ]),
    yearOrganizationEstablished: z.number(),
    registeredWithMssp: z.boolean(),
    proofOfRegistrationWithMssp: z.string().optional(),
    programUpdatesSinceLastReport: z.string().optional(),

    // Facility
    facilityType: z.array(
      z.enum([
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
      ])
    ),
    organizationType: z.array(
      z.enum(["non_profit", "for_profit", "faith_based"])
    ),
    governmentRun: z.boolean(),
    emergencyMedicalRecordsSystemPresent: z.boolean(),
    emergencyMedicalRecordsSystemName: z.string().optional(),
    numberOfInpatientBeds: z.number().int(),
    numberOfPatientsServedAnnually: z.number().int(),
    communityMobileOutreachOffered: z.boolean(),
    communityMobileOutreachDescription: z.string().optional(),

    // Infrastructure and Services
    facilityDescription: z.string().optional(),
    cleanWaterAccessible: z.boolean(),
    cleanWaterDescription: z.string().optional(),
    closestSourceOfCleanWater: z.string().optional(),
    sanitationFacilitiesPresent: z.boolean(),
    sanitationFacilitiesLockableFromInside: z.boolean().optional(),
    electricityAvailable: z.boolean(),
    accessibleByDisablePatients: z.boolean(),
    medicationDisposalProcessDefined: z.boolean(),
    medicationDisposalProcessDescription: z.string().optional(),
    pickupVehiclePresent: z.boolean(),
    pickupVehicleType: z.string().optional(),
    pickupLocations: z
      .array(z.enum(["les_cayes", "port_au_prince"]))
      .optional(),

    // Programs and Services Provided
    medicalServicesProvided: z.array(
      z.enum([
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
      ])
    ),
    otherMedicalServicesProvided: z.string().optional(),

    // Finances
    patientsWhoCannotPay: z.string().optional(),
    percentageOfPatientsNeedingFinancialAid: z.number().int(),
    percentageOfPatientsReceivingFreeTreatment: z.number().int(),
    annualSpendingOnMedicationsAndMedicalSupplies: z.enum([
      "1_to_5000",
      "5001_to_10000",
      "10001_to_25000",
      "25001_to_50000",
      "50001_to_100000",
      "100001+",
    ]),
    numberOfPrescriptionsPrescribedAnnuallyTracked: z.boolean(),
    numberOfTreatmentsPrescribedAnnually: z.number().int(),
    anyMenServedLastYear: z.boolean(),
    menServedLastYear: z.number().int(),
    anyWomenServedLastYear: z.boolean(),
    womenServedLastYear: z.number().int(),
    anyBoysServedLastYear: z.boolean(),
    boysServedLastYear: z.number().int(),
    anyGirlsServedLastYear: z.boolean(),
    girlsServedLastYear: z.number().int(),
    anyBabyBoysServedLastYear: z.boolean(),
    babyBoysServedLastYear: z.number().int(),
    anyBabyGirlsServedLastYear: z.boolean(),
    babyGirlsServedLastYear: z.number().int(),
    totalPatientsServedLastYear: z.number().int(),

    // Staff
    numberOfDoctors: z.number().int(),
    numberOfNurses: z.number().int(),
    numberOfMidwives: z.number().int(),
    numberOfAuxilaries: z.number().int(),
    numberOfStatisticians: z.number().int(),
    numberOfPharmacists: z.number().int(),
    numberOfCHW: z.number().int(),
    numberOfAdministrative: z.number().int(),
    numberOfHealthOfficers: z.number().int(),
    totalNumberOfStaff: z.number().int(),
    other: z.string().optional(),

    // Medical Supplies
    mostNeededMedicalSupplies: z.array(
      z.enum([
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
      ])
    ),
    otherSpecialityItemsNeeded: z.string().optional(),
  })
  .refine(
    (data) => !(data.registeredWithMssp && !data.proofOfRegistrationWithMssp),
    {
      message: "Proof of registration with MSSP is required",
      path: ["proofOfRegistrationWithMssp"],
    }
  )
  .refine(
    (data) =>
      !(
        data.emergencyMedicalRecordsSystemPresent &&
        !data.emergencyMedicalRecordsSystemName
      ),
    {
      message: "Name of emergency medical records system is required",
      path: ["emergencyMedicalRecordsSystemName"],
    }
  )
  .refine(
    (data) =>
      !(
        data.communityMobileOutreachOffered &&
        !data.communityMobileOutreachDescription
      ),
    {
      message:
        "Description of how often and what services are offered for community/mobile outreach is required",
      path: ["communityMobileOutreachDescription"],
    }
  )
  .refine(
    (data) => !(data.cleanWaterAccessible && !data.cleanWaterDescription),
    {
      message: "Description of accessible clean water is required",
      path: ["cleanWaterDescription"],
    }
  )
  .refine(
    (data) =>
      !(
        !data.cleanWaterAccessible &&
        (!data.closestSourceOfCleanWater ||
          (typeof data.closestSourceOfCleanWater === "string" &&
            data.closestSourceOfCleanWater.trim() === ""))
      ),
    {
      message: "Closest source of clean water is required",
      path: ["closestSourceOfCleanWater"],
    }
  )
  .refine(
    (data) =>
      !(
        data.sanitationFacilitiesPresent &&
        (data.sanitationFacilitiesLockableFromInside === undefined ||
          data.sanitationFacilitiesLockableFromInside === null)
      ),
    {
      message:
        "Whether sanitation facilities are lockable from inside is required",
      path: ["sanitationFacilitiesLockableFromInside"],
    }
  )
  .refine(
    (data) =>
      !(
        data.medicationDisposalProcessDefined &&
        !data.medicationDisposalProcessDescription
      ),
    {
      message: "Description of medication disposal process is required",
      path: ["medicationDisposalProcessDescription"],
    }
  )
  .refine((data) => !(data.pickupVehiclePresent && !data.pickupVehicleType), {
    message: "Pick-up vehicle type is required",
    path: ["pickupVehicleType"],
  })
  .refine(
    (data) =>
      !(
        data.pickupVehiclePresent &&
        (!Array.isArray(data.pickupLocations) ||
          data.pickupLocations.length === 0)
      ),
    {
      message: "At least one pick-up location required",
      path: ["pickupLocations"],
    }
  )
  .refine(
    (data) =>
      !(
        data.anyMenServedLastYear &&
        (data.menServedLastYear === undefined ||
          data.menServedLastYear === null ||
          (typeof data.menServedLastYear === "number" &&
            isNaN(data.menServedLastYear)))
      ),
    {
      message: "Must specify how many men (18+) were served last year",
      path: ["menServedLastYear"],
    }
  )
  .refine(
    (data) =>
      !(
        data.anyWomenServedLastYear &&
        (data.womenServedLastYear === undefined ||
          data.womenServedLastYear === null ||
          (typeof data.womenServedLastYear === "number" &&
            isNaN(data.womenServedLastYear)))
      ),
    {
      message: "Must specify how many women (18+) were served last year",
      path: ["womenServedLastYear"],
    }
  )
  .refine(
    (data) =>
      !(
        data.anyBoysServedLastYear &&
        (data.boysServedLastYear === undefined ||
          data.boysServedLastYear === null ||
          (typeof data.boysServedLastYear === "number" &&
            isNaN(data.boysServedLastYear)))
      ),
    {
      message: "Must specify how many boys (1-17) were served last year",
      path: ["boysServedLastYear"],
    }
  )
  .refine(
    (data) =>
      !(
        data.anyGirlsServedLastYear &&
        (data.girlsServedLastYear === undefined ||
          data.girlsServedLastYear === null ||
          (typeof data.girlsServedLastYear === "number" &&
            isNaN(data.girlsServedLastYear)))
      ),
    {
      message: "Must specify how many girls (1-17) were served last year",
      path: ["girlsServedLastYear"],
    }
  )
  .refine(
    (data) =>
      !(
        data.anyBabyBoysServedLastYear &&
        (data.babyBoysServedLastYear === undefined ||
          data.babyBoysServedLastYear === null ||
          (typeof data.babyBoysServedLastYear === "number" &&
            isNaN(data.babyBoysServedLastYear)))
      ),
    {
      message: "Must specify how many baby boys (<1) were served last year",
      path: ["babyBoysServedLastYear"],
    }
  )
  .refine(
    (data) =>
      !(
        data.anyBabyGirlsServedLastYear &&
        (data.babyGirlsServedLastYear === undefined ||
          data.babyGirlsServedLastYear === null ||
          (typeof data.babyGirlsServedLastYear === "number" &&
            isNaN(data.babyGirlsServedLastYear)))
      ),
    {
      message: "Must specify how many baby girls (<1) were served last year",
      path: ["babyGirlsServedLastYear"],
    }
  );

export const partnerDetails1 = z.object({
  // General
  siteName: z.string(),
  address: z.string(),
  department: z.string(),
  gpsCoordinates: z.string().optional(),
  website: z.string().optional(),
  socialMedia: z.string().optional(),
});

export const partnerDetails2 = z.object({
  // Contact
  regionalContact: contactSchema,
  medicalContact: contactSchema,
  adminDirectorContact: contactSchema,
  pharmacyContact: contactSchema,
  contactWhatsAppName: z.string().optional(),
  contactWhatsAppNumber: z.string().optional(),
});

export const partnerDetails3 = z
  .object({
    // Introduction
    organizationHistory: z.string(),
    supportRequested: z.enum([
      "ongoing_support",
      "mobile_clinic_support",
      "one_time_request",
      "project_support",
    ]),
    yearOrganizationEstablished: z.number(),
    registeredWithMssp: z.boolean(),
    proofOfRegistrationWithMssp: z.string().optional(),
    programUpdatesSinceLastReport: z.string().optional(),
  })
  .refine(
    (data) => !(data.registeredWithMssp && !data.proofOfRegistrationWithMssp),
    {
      message: "Proof of registration with MSSP is required",
      path: ["proofOfRegistrationWithMssp"],
    }
  );

export const partnerDetails4 = z
  .object({
    // Facility
    facilityType: z.array(
      z.enum([
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
      ])
    ),
    organizationType: z.array(
      z.enum(["non_profit", "for_profit", "faith_based"])
    ),
    governmentRun: z.boolean(),
    emergencyMedicalRecordsSystemPresent: z.boolean(),
    emergencyMedicalRecordsSystemName: z.string().optional(),
    numberOfInpatientBeds: z.number().int(),
    numberOfPatientsServedAnnually: z.number().int(),
    communityMobileOutreachOffered: z.boolean(),
    communityMobileOutreachDescription: z.string().optional(),
  })
  .refine(
    (data) =>
      !(
        data.emergencyMedicalRecordsSystemPresent &&
        !data.emergencyMedicalRecordsSystemName
      ),
    {
      message: "Name of emergency medical records system is required",
      path: ["emergencyMedicalRecordsSystemName"],
    }
  )
  .refine(
    (data) =>
      !(
        data.communityMobileOutreachOffered &&
        !data.communityMobileOutreachDescription
      ),
    {
      message:
        "Description of how often and what services are offered for community/mobile outreach is required",
      path: ["communityMobileOutreachDescription"],
    }
  );

export const partnerDetails5 = z
  .object({
    // Infrastructure and Services
    facilityDescription: z.string().optional(),
    cleanWaterAccessible: z.boolean(),
    cleanWaterDescription: z.string().optional(),
    closestSourceOfCleanWater: z.string().optional(),
    sanitationFacilitiesPresent: z.boolean(),
    sanitationFacilitiesLockableFromInside: z.boolean().optional(),
    electricityAvailable: z.boolean(),
    accessibleByDisablePatients: z.boolean(),
    medicationDisposalProcessDefined: z.boolean(),
    medicationDisposalProcessDescription: z.string().optional(),
    pickupVehiclePresent: z.boolean(),
    pickupVehicleType: z.string().optional(),
    pickupLocations: z
      .array(z.enum(["les_cayes", "port_au_prince"]))
      .optional(),
  })
  .refine(
    (data) => !(data.cleanWaterAccessible && !data.cleanWaterDescription),
    {
      message: "Description of accessible clean water is required",
      path: ["cleanWaterDescription"],
    }
  )
  .refine(
    (data) =>
      !(
        !data.cleanWaterAccessible &&
        (!data.closestSourceOfCleanWater ||
          (typeof data.closestSourceOfCleanWater === "string" &&
            data.closestSourceOfCleanWater.trim() === ""))
      ),
    {
      message: "Closest source of clean water is required",
      path: ["closestSourceOfCleanWater"],
    }
  )
  .refine(
    (data) =>
      !(
        data.sanitationFacilitiesPresent &&
        (data.sanitationFacilitiesLockableFromInside === undefined ||
          data.sanitationFacilitiesLockableFromInside === null)
      ),
    {
      message:
        "Whether sanitation facilities are lockable from inside is required",
      path: ["sanitationFacilitiesLockableFromInside"],
    }
  )
  .refine(
    (data) =>
      !(
        data.medicationDisposalProcessDefined &&
        !data.medicationDisposalProcessDescription
      ),
    {
      message: "Description of medication disposal process is required",
      path: ["medicationDisposalProcessDescription"],
    }
  )
  .refine((data) => !(data.pickupVehiclePresent && !data.pickupVehicleType), {
    message: "Pick-up vehicle type is required",
    path: ["pickupVehicleType"],
  })
  .refine(
    (data) =>
      !(
        data.pickupVehiclePresent &&
        (!Array.isArray(data.pickupLocations) ||
          data.pickupLocations.length === 0)
      ),
    {
      message: "At least one pick-up location required",
      path: ["pickupLocations"],
    }
  );

export const partnerDetails6 = z.object({
  // Programs and Services Provided
  medicalServicesProvided: z.array(
    z.enum([
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
    ])
  ),
  otherMedicalServicesProvided: z.string().optional(),
});

export const partnerDetails7 = z.object({
  // Finances
  CannotPay: z.string().optional(),
  percentageOfPatientsNeedingFinancialAid: z.number().int(),
  percentageOfPatientsReceivingFreeTreatment: z.number().int(),
  annualSpendingOnMedicationsAndMedicalSupplies: z.enum([
    "1_to_5000",
    "5001_to_10000",
    "10001_to_25000",
    "25001_to_50000",
    "50001_to_100000",
    "100001+",
  ]),
  numberOfPrescriptionsPrescribedAnnuallyTracked: z.boolean(),
  numberOfTreatmentsPrescribedAnnually: z.number().int(),
});

export const partnerDetails8 = z.object({
  anyMenServedLastYear: z.boolean(),
  menServedLastYear: z.number().int(),
  anyWomenServedLastYear: z.boolean(),
  womenServedLastYear: z.number().int(),
  anyBoysServedLastYear: z.boolean(),
  boysServedLastYear: z.number().int(),
  anyGirlsServedLastYear: z.boolean(),
  girlsServedLastYear: z.number().int(),
  anyBabyBoysServedLastYear: z.boolean(),
  babyBoysServedLastYear: z.number().int(),
  anyBabyGirlsServedLastYear: z.boolean(),
  babyGirlsServedLastYear: z.number().int(),
  totalPatientsServedLastYear: z.number().int(),
});

export const partnerDetails9 = z.object({
  // Staff
  numberOfDoctors: z.number().int(),
  numberOfNurses: z.number().int(),
  numberOfMidwives: z.number().int(),
  numberOfAuxilaries: z.number().int(),
  numberOfStatisticians: z.number().int(),
  numberOfPharmacists: z.number().int(),
  numberOfCHW: z.number().int(),
  numberOfAdministrative: z.number().int(),
  numberOfHealthOfficers: z.number().int(),
  totalNumberOfStaff: z.number().int(),
  other: z.string().optional(),
});

export const partnerDetails10 = z.object({
  // Medical Supplies
  mostNeededMedicalSupplies: z.array(
    z.enum([
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
    ])
  ),
  otherSpecialityItemsNeeded: z.string().optional(),
});

export type PartnerDetails1 = z.infer<typeof partnerDetails1>;
export type PartnerDetails2 = z.infer<typeof partnerDetails2>;
export type PartnerDetails3 = z.infer<typeof partnerDetails3>;
export type PartnerDetails4 = z.infer<typeof partnerDetails4>;
export type PartnerDetails5 = z.infer<typeof partnerDetails5>;
export type PartnerDetails6 = z.infer<typeof partnerDetails6>;
export type PartnerDetails7 = z.infer<typeof partnerDetails7>;
export type PartnerDetails8 = z.infer<typeof partnerDetails8>;
export type PartnerDetails9 = z.infer<typeof partnerDetails9>;
export type PartnerDetails10 = z.infer<typeof partnerDetails10>;
export type PartnerDetails = z.infer<typeof partnerDetailsSchema>;
export type Contact = z.infer<typeof contactSchema>;

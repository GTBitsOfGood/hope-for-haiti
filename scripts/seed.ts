/* eslint-disable @typescript-eslint/no-unused-vars */
import { exit } from "process";
import { db } from "@/db";
import { hash } from "argon2";
import {
  DonorOfferState,
  Item,
  ItemCategory,
  Prisma,
  RequestPriority,
  UserType,
} from "@prisma/client";
import { GeneralItem } from "@/types/api/unallocatedItem.types";

const donorNames = ["Donor A", "Donor B", "Donor C", "Donor D"];
const lots = ["Lot A", "Lot B", "Lot C", "Lot D"];
const pallets = ["Pallet A", "Pallet B", "Pallet C", "Pallet D"];
const boxes = ["Box A", "Box B", "Box C", "Box D"];

function dateOffset(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0);
  d.setMinutes(0);
  d.setMilliseconds(0);
  return d;
}

function pick<T>(items: Array<T>): T {
  return items[Math.floor(Math.random() * items.length)];
}

function sample<T>(count: number, items: Array<T>): T[] {
  if (count > items.length) {
    throw new Error("Cannot sample more items than are available");
  }

  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap
  }

  return shuffled.slice(0, count);
}

function randInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Partner details template based on partnerDetails.ts schema
const partnerDetailsTemplate = {
  // General
  siteName: "Hope Medical Center",
  address: "123 Healthcare Avenue, Port-au-Prince, Haiti",
  department: "Ouest",
  gpsCoordinates: "18.5392° N, 72.3350° W",
  website: "https://hopemedicine.ht",
  socialMedia: "@hopemedicine",

  // Contact
  regionalContact: {
    firstName: "Marie",
    lastName: "Joseph",
    orgTitle: "Regional Director",
    primaryTelephone: "+509 1234-5678",
    secondaryTelephone: "+509 1234-5679",
    email: "marie.joseph@hopemedicine.ht",
  },
  medicalContact: {
    firstName: "Jean",
    lastName: "Baptiste",
    orgTitle: "Chief Medical Officer",
    primaryTelephone: "+509 2345-6789",
    secondaryTelephone: "+509 2345-6790",
    email: "jean.baptiste@hopemedicine.ht",
  },
  adminDirectorContact: {
    firstName: "Pierre",
    lastName: "Morel",
    orgTitle: "Administrative Director",
    primaryTelephone: "+509 3456-7890",
    secondaryTelephone: "+509 3456-7891",
    email: "pierre.morel@hopemedicine.ht",
  },
  pharmacyContact: {
    firstName: "Claire",
    lastName: "Dumas",
    orgTitle: "Chief Pharmacist",
    primaryTelephone: "+509 4567-8901",
    secondaryTelephone: "+509 4567-8902",
    email: "claire.dumas@hopemedicine.ht",
  },
  contactWhatsAppName: "Dr. Marie Joseph",
  contactWhatsAppNumber: "+509 1234-5678",

  // Introduction
  organizationHistory:
    "Established to provide quality healthcare services to underserved communities in Haiti. Our mission is to improve health outcomes through accessible medical care and community outreach programs.",
  supportRequested: "ongoing_support",
  yearOrganizationEstablished: 2015,
  registeredWithMssp: true,
  proofOfRegistrationWithMssp: "mssp_registration_certificate.pdf",
  programUpdatesSinceLastReport:
    "Expanded maternal health services and added mobile clinic outreach program",

  // Facility
  facilityType: ["clinic", "primary_care", "health_center"],
  organizationType: ["non_profit"],
  governmentRun: false,
  emergencyMedicalRecordsSystemPresent: true,
  emergencyMedicalRecordsSystemName: "OpenMRS",
  numberOfInpatientBeds: 25,
  numberOfPatientsServedAnnually: 12000,
  communityMobileOutreachOffered: true,
  communityMobileOutreachDescription:
    "Weekly mobile clinics to remote communities, providing basic healthcare and health education",

  // Infrastructure and Services
  facilityDescription:
    "Modern healthcare facility with emergency care, maternal health, pediatrics, and pharmacy services",
  cleanWaterAccessible: true,
  cleanWaterDescription: "Municipal water supply with backup well water system",
  closestSourceOfCleanWater: "",
  sanitationFacilitiesPresent: true,
  sanitationFacilitiesLockableFromInside: true,
  electricityAvailable: true,
  accessibleByDisablePatients: true,
  medicationDisposalProcessDefined: true,
  medicationDisposalProcessDescription:
    "Proper pharmaceutical waste disposal following WHO guidelines with licensed waste management company",
  pickupVehiclePresent: true,
  pickupVehicleType: "Ambulance and supply truck",
  pickupLocations: ["port_au_prince"],

  // Programs and Services Provided
  medicalServicesProvided: [
    "pediatrics",
    "maternal_care",
    "lab_tests",
    "immunizations",
    "chronic_diseases",
  ],
  otherMedicalServicesProvided:
    "Health education, Community outreach, Vaccination programs",

  // Finances
  patientsWhoCannotPay:
    "Sliding scale fees and charity care program available for patients who cannot afford treatment",
  percentageOfPatientsNeedingFinancialAid: 65,
  percentageOfPatientsReceivingFreeTreatment: 30,
  annualSpendingOnMedicationsAndMedicalSupplies: "50001_to_100000",
  numberOfPrescriptionsPrescribedAnnuallyTracked: true,
  numberOfTreatmentsPrescribedAnnually: 15000,
  anyMenServedLastYear: true,
  menServedLastYear: 2800,
  anyWomenServedLastYear: true,
  womenServedLastYear: 3200,
  anyBoysServedLastYear: true,
  boysServedLastYear: 2100,
  anyGirlsServedLastYear: true,
  girlsServedLastYear: 2000,
  anyBabyBoysServedLastYear: true,
  babyBoysServedLastYear: 700,
  anyBabyGirlsServedLastYear: true,
  babyGirlsServedLastYear: 700,
  totalPatientsServedLastYear: 11500,

  // Staff
  numberOfDoctors: 4,
  numberOfNurses: 12,
  numberOfMidwives: 3,
  numberOfAuxilaries: 6,
  numberOfStatisticians: 1,
  numberOfPharmacists: 2,
  numberOfCHW: 8,
  numberOfAdministrative: 5,
  numberOfHealthOfficers: 2,
  totalNumberOfStaff: 45,
  other: "2 lab technicians, 1 social worker",

  // Medical Supplies
  mostNeededMedicalSupplies: [
    "anti_infectives",
    "cardiovascular",
    "bandages",
    "syringes_needles",
    "vitamins_minerals",
  ],
  otherSpecialityItemsNeeded:
    "Blood pressure monitors, glucometers, wound care supplies",
};

const generalItems: Array<GeneralItem> = [
  {
    title: "Advil",
    type: "Pain Killer",
    expirationDate: dateOffset(30).toISOString(),
    unitType: "Bottle",
    quantityPerUnit: 50,
  },
  {
    title: "Tylenol",
    type: "Pain Killer",
    expirationDate: dateOffset(4 * 30).toISOString(),
    unitType: "Bottle",
    quantityPerUnit: 20,
  },
  {
    title: "Bandages",
    type: "First Aid",
    expirationDate: dateOffset(20 * 12 * 30).toISOString(),
    unitType: "Box",
    quantityPerUnit: 100,
  },
  {
    title: "Apples",
    type: "Fruit",
    expirationDate: dateOffset(15).toISOString(),
    unitType: "Box",
    quantityPerUnit: 4,
  },
  {
    title: "Bananas",
    type: "Fruit",
    expirationDate: dateOffset(15).toISOString(),
    unitType: "Bundle",
    quantityPerUnit: 4,
  },
];

interface ItemTemplate extends GeneralItem {
  category: ItemCategory;
  unitPrice: Prisma.Decimal;
  maxRequestLimit: string | null;
}

const itemTemplates: Array<ItemTemplate> = [
  {
    title: "Advil",
    type: "Pain Killer",
    expirationDate: dateOffset(30).toISOString(),
    unitType: "Bottle",
    quantityPerUnit: 50,
    category: ItemCategory.MEDICATION,
    unitPrice: new Prisma.Decimal(10),
    maxRequestLimit: null,
  },
  {
    title: "Tylenol",
    type: "Pain Killer",
    expirationDate: dateOffset(4 * 30).toISOString(),
    unitType: "Bottle",
    quantityPerUnit: 20,
    category: ItemCategory.MEDICATION,
    unitPrice: new Prisma.Decimal(5),
    maxRequestLimit: null,
  },
  {
    title: "Bandages",
    type: "First Aid",
    expirationDate: null as unknown as string,
    unitType: "Box",
    quantityPerUnit: 100,
    category: ItemCategory.MEDICAL_SUPPLY,
    unitPrice: new Prisma.Decimal(25),
    maxRequestLimit: null,
  },
  {
    title: "Apples",
    type: "Fruit",
    expirationDate: dateOffset(15).toISOString(),
    unitType: "Box",
    quantityPerUnit: 4,
    category: ItemCategory.NON_MEDICAL,
    unitPrice: new Prisma.Decimal(2),
    maxRequestLimit: null,
  },
  {
    title: "Bananas",
    type: "Fruit",
    expirationDate: dateOffset(15).toISOString(),
    unitType: "Bundle",
    quantityPerUnit: 4,
    category: ItemCategory.NON_MEDICAL,
    unitPrice: new Prisma.Decimal(1.5),
    maxRequestLimit: null,
  },
];

function genItem(props: Partial<Item> = {}): Omit<Item, "id"> {
  const template = pick(itemTemplates);
  return {
    ...template,
    expirationDate: template.expirationDate
      ? new Date(template.expirationDate)
      : null,
    donorName: pick(donorNames),
    quantity: randInt(1, 10) * 10,
    lotNumber: pick(lots),
    palletNumber: pick(pallets),
    boxNumber: pick(boxes),
    donorShippingNumber: null,
    hfhShippingNumber: null,
    datePosted: new Date(),
    ndc: null,
    notes: null,
    allowAllocations: true,
    visible: true,
    gik: true,
    donorOfferItemId: null,
    ...props,
  };
}

async function run() {
  await db.$transaction(async (tx) => {
    await tx.shippingStatus.deleteMany();
    await tx.donorOfferPartnerVisibility.deleteMany();
    await tx.donorOfferItemRequestAllocation.deleteMany();
    await tx.donorOfferItemRequest.deleteMany();
    await tx.donorOfferItem.deleteMany();
    await tx.donorOffer.deleteMany();
    await tx.unallocatedItemRequestAllocation.deleteMany();
    await tx.unallocatedItemRequest.deleteMany();
    await tx.distribution.deleteMany();
    await tx.signOff.deleteMany();
    await tx.user.deleteMany();
    await tx.userInvite.deleteMany();
    await tx.item.deleteMany();

    const pwHash = await hash("root");

    await tx.user.create({
      data: {
        email: "superadmin@test.com",
        passwordHash: pwHash,
        type: UserType.SUPER_ADMIN,
        name: "Super Admin",
      },
    });
    await tx.user.create({
      data: {
        email: "admin@test.com",
        passwordHash: pwHash,
        type: UserType.ADMIN,
        name: "Admin",
      },
    });
    await tx.user.create({
      data: {
        email: "staff@test.com",
        passwordHash: pwHash,
        type: UserType.STAFF,
        name: "Staff",
      },
    });
    await tx.user.createManyAndReturn({
      data: Array.from({ length: 20 }, (_, i) => i).map((i: number) => ({
        email: `partner${i + 1}@test.com`,
        passwordHash: pwHash,
        type: UserType.PARTNER,
        name: `Partner ${i + 1}`,
        partnerDetails: {
          ...partnerDetailsTemplate,
          siteName: `${partnerDetailsTemplate.siteName} ${i + 1}`,
          // Update contact emails to be unique
          regionalContact: {
            ...partnerDetailsTemplate.regionalContact,
            email: `regional.partner${i + 1}@test.com`,
          },
          medicalContact: {
            ...partnerDetailsTemplate.medicalContact,
            email: `medical.partner${i + 1}@test.com`,
          },
          adminDirectorContact: {
            ...partnerDetailsTemplate.adminDirectorContact,
            email: `admin.partner${i + 1}@test.com`,
          },
          pharmacyContact: {
            ...partnerDetailsTemplate.pharmacyContact,
            email: `pharmacy.partner${i + 1}@test.com`,
          },
          // Vary some details to make each partner unique
          yearOrganizationEstablished: 2010 + (i % 10),
          numberOfInpatientBeds: 15 + (i % 20),
          numberOfPatientsServedAnnually: 8000 + i * 500,
          numberOfDoctors: 2 + (i % 5),
          numberOfNurses: 8 + (i % 10),
          numberOfMidwives: 1 + (i % 4),
          numberOfPharmacists: 1 + (i % 3),
          totalNumberOfStaff: 30 + (i % 25),
          totalPatientsServedLastYear: 7500 + i * 400,
          menServedLastYear: 2000 + i * 100,
          womenServedLastYear: 2500 + i * 120,
          boysServedLastYear: 1500 + i * 80,
          girlsServedLastYear: 1500 + i * 80,
        },
      })),
    });

    await tx.userInvite.create({
      data: {
        email: "new-admin@test.com",
        expiration: new Date("July 24, 3000"),
        name: "New Admin",
        token: "1234",
        userType: UserType.ADMIN,
      },
    });

    await tx.item.createManyAndReturn({
      data: Array.from({ length: 100 }, () => genItem()),
    });

    const partners = await tx.user.findMany({
      where: { type: UserType.PARTNER },
    });

    await tx.unallocatedItemRequest.createManyAndReturn({
      data: Array.from({ length: 20 }, () => {
        const genItem = pick(generalItems);
        return {
          partnerId: pick(partners).id,
          ...genItem,
          priority: pick(Object.values(RequestPriority)) as RequestPriority,
          quantity: randInt(1, 4) * 5,
          comments: "pls",
        };
      }),
    });

    await Promise.all(
      (
        [
          {
            state: DonorOfferState.UNFINALIZED,
            offerName: "Offer A",
            donorName: "Donor A",
            partnerResponseDeadline: dateOffset(20),
            donorResponseDeadline: dateOffset(30),
            items: {
              create: sample(randInt(2, 4), generalItems).map((item) => ({
                ...item,
                quantity: randInt(1, 3) * 10,
                requests: {
                  create: sample(4, partners).map((partner) => ({
                    partnerId: partner.id,
                    quantity: randInt(1, 8),
                    comments: "pls give me this",
                    priority: pick(
                      Object.values(RequestPriority)
                    ) as RequestPriority,
                  })),
                },
              })),
            },
            partnerVisibilities: {
              create: partners.map((partner: { id: number }) => ({
                partnerId: partner.id,
              })),
            },
          },
          {
            state: DonorOfferState.UNFINALIZED,
            offerName: "Offer B",
            donorName: "Donor B",
            partnerResponseDeadline: dateOffset(20),
            donorResponseDeadline: dateOffset(30),
            items: {
              create: sample(randInt(2, 4), generalItems).map((item) => ({
                ...item,
                quantity: randInt(1, 3) * 10,
                requests: {
                  create: sample(2, partners).map((partner) => ({
                    partnerId: partner.id,
                    quantity: randInt(1, 8),
                    comments: "pls give me this",
                    priority: pick(
                      Object.values(RequestPriority)
                    ) as RequestPriority,
                  })),
                },
              })),
            },
            partnerVisibilities: {
              create: partners.map((partner: { id: number }) => ({
                partnerId: partner.id,
              })),
            },
          },
          {
            state: DonorOfferState.UNFINALIZED,
            offerName: "Offer C",
            donorName: "Donor C",
            partnerResponseDeadline: dateOffset(20),
            donorResponseDeadline: dateOffset(30),
            items: {
              create: sample(randInt(2, 4), generalItems).map((item) => ({
                ...item,
                quantity: randInt(1, 3) * 10,
                requests: {
                  create: sample(1, partners).map((partner) => ({
                    partnerId: partner.id,
                    quantity: randInt(1, 8),
                    comments: "pls give me this",
                    priority: pick(
                      Object.values(RequestPriority)
                    ) as RequestPriority,
                  })),
                },
              })),
            },
            partnerVisibilities: {
              create: partners.map((partner: { id: number }) => ({
                partnerId: partner.id,
              })),
            },
          },
          {
            state: DonorOfferState.UNFINALIZED,
            offerName: "Offer D",
            donorName: "Donor D",
            partnerResponseDeadline: dateOffset(20),
            donorResponseDeadline: dateOffset(30),
            items: {
              create: sample(randInt(2, 4), generalItems).map((item) => ({
                ...item,
                quantity: randInt(1, 3) * 10,
                requests: {
                  create: sample(3, partners).map((partner) => ({
                    partnerId: partner.id,
                    quantity: randInt(1, 8),
                    comments: "pls give me this",
                    priority: pick(
                      Object.values(RequestPriority)
                    ) as RequestPriority,
                  })),
                },
              })),
            },
            partnerVisibilities: {
              create: partners.map((partner: { id: number }) => ({
                partnerId: partner.id,
              })),
            },
          },
        ] as Prisma.DonorOfferCreateInput[]
      ).map((data) => tx.donorOffer.create({ data }))
    );
  });
}

run()
  .then(() => {
    console.info("DB seeded");

    exit(0);
  })
  .catch((err) => {
    console.error("Error seeding DB");
    console.error(err);

    exit(1);
  });

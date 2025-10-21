import { exit } from "process";
import { hash } from "argon2";
import {
  DonorOfferState,
  ItemCategory,
  RequestPriority,
  ShipmentStatus,
  UserType,
} from "@prisma/client";

import { db } from "@/db";
import type { Prisma } from "@prisma/client";

type PartnerSeed = {
  key: string;
  name: string;
  email: string;
  tag: string;
  pending?: boolean;
  partnerDetails: Prisma.JsonObject;
};

type GeneralItemRequestSeed = {
  partnerKey: string;
  quantity: number;
  finalQuantity?: number;
  comments?: string;
  priority?: RequestPriority;
};

type LineItemSeed = {
  category: ItemCategory;
  donorName: string;
  quantity: number;
  lotNumber: string;
  palletNumber: string;
  boxNumber: string;
  unitPrice: number;
  allowAllocations: boolean;
  visible: boolean;
  gik: boolean;
  maxRequestLimit?: string;
  donorShippingNumber?: string;
  hfhShippingNumber?: string;
  ndc?: string;
  notes?: string;
};

type GeneralItemSeed = {
  title: string;
  unitType: string;
  expirationDate?: Date;
  initialQuantity: number;
  requestQuantity?: number;
  requests: GeneralItemRequestSeed[];
  lineItems?: LineItemSeed[];
};

const addDays = (daysFromToday: number) => {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + daysFromToday);
  return base;
};

const buildPartnerDetails = (
  siteName: string,
  department: string,
  contactPrefix: string
): Prisma.JsonObject =>
  ({
    siteName,
    address: `${siteName}, ${department}, Haiti`,
    department,
  gpsCoordinates: "18.5392° N, 72.3350° W",
  website: "https://hopeforhaiti.org",
  socialMedia: `@${contactPrefix}`,
  regionalContact: {
    firstName: "Marie",
    lastName: "Joseph",
    orgTitle: "Regional Director",
    primaryTelephone: "+509 1234-5678",
    email: `${contactPrefix}.regional@test.com`,
  },
  medicalContact: {
    firstName: "Jean",
    lastName: "Baptiste",
    orgTitle: "Chief Medical Officer",
    primaryTelephone: "+509 2345-6789",
    email: `${contactPrefix}.medical@test.com`,
  },
  pharmacyContact: {
    firstName: "Claire",
    lastName: "Dumas",
    orgTitle: "Pharmacy Lead",
    primaryTelephone: "+509 3456-7890",
    email: `${contactPrefix}.pharmacy@test.com`,
  },
  facilityType: ["clinic", "primary_care"],
  organizationType: ["non_profit"],
  cleanWaterAccessible: true,
  medicationDisposalProcessDefined: true,
  programs: [
    "maternal_health",
    "chronic_disease_support",
    "mobile_outreach",
    "emergency_response",
  ],
  }) as Prisma.JsonObject;

const partnerSeeds: PartnerSeed[] = [
  {
    key: "hope_medical_center",
    name: "Hope Medical Center",
    email: "partner1@test.com",
    tag: "internal",
    partnerDetails: buildPartnerDetails(
      "Hope Medical Center",
      "Ouest",
      "hopecenter"
    ),
  },
  {
    key: "mobile_response_unit",
    name: "HFH Mobile Response Unit",
    email: "partner2@test.com",
    tag: "internal",
    partnerDetails: buildPartnerDetails(
      "HFH Mobile Response Unit",
      "Sud",
      "hfhmobile"
    ),
  },
  {
    key: "les_cayes_hospital",
    name: "Les Cayes Community Hospital",
    email: "partner3@test.com",
    tag: "external",
    partnerDetails: buildPartnerDetails(
      "Les Cayes Community Hospital",
      "Sud",
      "lescayes"
    ),
  },
  {
    key: "jeremie_network",
    name: "Jeremie Health Network",
    email: "partner4@test.com",
    tag: "external",
    partnerDetails: buildPartnerDetails(
      "Jeremie Health Network",
      "Grand'Anse",
      "jeremie"
    ),
  },
  {
    key: "cap_haitien_wellness",
    name: "Cap Haitien Wellness Center",
    email: "partner5@test.com",
    tag: "external",
    pending: true,
    partnerDetails: buildPartnerDetails(
      "Cap Haitien Wellness Center",
      "Nord",
      "caphaitien"
    ),
  },
];

const unfinalizedGeneralItems: GeneralItemSeed[] = [
  {
    title: "Amoxicillin 500mg Capsules",
    unitType: "Bottle",
    expirationDate: new Date("2026-06-30"),
    initialQuantity: 900,
    requestQuantity: 790,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 220,
        comments: "High volume of outpatient infections right now.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 180,
        comments: "Supporting mobile clinics in remote areas.",
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 200,
        comments: "Maintaining continuity of care post-storm.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 110,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 80,
        comments: "Requested for chronic care patients.",
        priority: RequestPriority.MEDIUM,
      },
    ],
  },
  {
    title: "Oral Rehydration Salt Packets",
    unitType: "Case",
    expirationDate: new Date("2025-12-31"),
    initialQuantity: 500,
    requestQuantity: 470,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 120,
        comments: "Seasonal cholera prevention campaign.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 80,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 140,
        comments: "Serving displaced families near the coast.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 70,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 60,
        comments: "Needs for malnutrition program.",
        priority: RequestPriority.MEDIUM,
      },
    ],
  },
  {
    title: "Insulin Glargine 10ml Vials",
    unitType: "Box",
    expirationDate: new Date("2025-04-30"),
    initialQuantity: 180,
    requestQuantity: 205,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 60,
        comments: "Diabetes clinic expansion.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 45,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 50,
        comments: "Refilling cold-chain dependent supply.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 30,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 20,
        comments: "Newly diagnosed patients.",
        priority: RequestPriority.MEDIUM,
      },
    ],
  },
  {
    title: "Disposable Syringes 5ml",
    unitType: "Case",
    expirationDate: new Date("2027-01-15"),
    initialQuantity: 1200,
    requestQuantity: 1090,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 280,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 220,
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 260,
        comments: "Supporting expanded vaccination drive.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 180,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 150,
        priority: RequestPriority.MEDIUM,
      },
    ],
  },
  {
    title: "Sterile Surgical Gloves Size M",
    unitType: "Case",
    expirationDate: new Date("2026-11-20"),
    initialQuantity: 800,
    requestQuantity: 720,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 160,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 140,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 170,
        comments: "Operating theater resupply.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 130,
        comments: "Preparing for scheduled surgical caravan.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 120,
        priority: RequestPriority.MEDIUM,
      },
    ],
  },
  {
    title: "Prenatal Vitamins 180ct Bottles",
    unitType: "Bottle",
    expirationDate: new Date("2025-09-30"),
    initialQuantity: 600,
    requestQuantity: 550,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 140,
        comments: "Maternal health clinic usage.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 110,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 120,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 90,
        comments: "Community midwife program.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 90,
        priority: RequestPriority.MEDIUM,
      },
    ],
  },
  {
    title: "Blood Pressure Monitors",
    unitType: "Unit",
    expirationDate: new Date("2028-03-31"),
    initialQuantity: 85,
    requestQuantity: 82,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 22,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 18,
        comments: "Mobile hypertension screening outreach.",
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 20,
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 12,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 10,
        comments: "Replacement units for rural clinics.",
        priority: RequestPriority.MEDIUM,
      },
    ],
  },
  {
    title: "Portable Nebulizer Kits",
    unitType: "Kit",
    expirationDate: new Date("2027-08-15"),
    initialQuantity: 150,
    requestQuantity: 140,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 35,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 30,
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 32,
        comments: "Respiratory clinic increase.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 23,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 20,
        comments: "Needs for pediatric asthma.",
        priority: RequestPriority.HIGH,
      },
    ],
  },
  {
    title: "Suture Removal Kits",
    unitType: "Box",
    expirationDate: new Date("2026-04-30"),
    initialQuantity: 260,
    requestQuantity: 240,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 60,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 45,
        comments: "Follow-up for minor surgeries.",
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 55,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 45,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 35,
        priority: RequestPriority.MEDIUM,
      },
    ],
  },
  {
    title: "Chlorhexidine Antiseptic Solution",
    unitType: "Case",
    expirationDate: new Date("2025-11-30"),
    initialQuantity: 320,
    requestQuantity: 300,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 75,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 65,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 72,
        comments: "Operating rooms and wound care.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 48,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 40,
        priority: RequestPriority.MEDIUM,
      },
    ],
  },
];

const finalizedGeneralItems: GeneralItemSeed[] = [
  {
    title: "0.9% Sodium Chloride IV Bags",
    unitType: "Case",
    expirationDate: new Date("2027-02-28"),
    initialQuantity: 600,
    requestQuantity: 600,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 160,
        finalQuantity: 160,
        comments: "Planning perioperative support.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 130,
        finalQuantity: 130,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 150,
        finalQuantity: 150,
        comments: "Trauma ward resupply.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 90,
        finalQuantity: 90,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 70,
        finalQuantity: 70,
        priority: RequestPriority.MEDIUM,
      },
    ],
    lineItems: [
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Global Health Trust",
        quantity: 150,
        lotNumber: "LOT-NA-2405",
        palletNumber: "PAL-NA-01",
        boxNumber: "BOX-001",
        unitPrice: 12.5,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-001",
        hfhShippingNumber: "HFH-2406-001",
        ndc: "00409-0882-02",
        notes: "Stored at depot Port-au-Prince.",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Global Health Trust",
        quantity: 180,
        lotNumber: "LOT-NA-2406",
        palletNumber: "PAL-NA-02",
        boxNumber: "BOX-002",
        unitPrice: 12.5,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-002",
        hfhShippingNumber: "HFH-2406-001",
        ndc: "00409-0882-02",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Global Health Trust",
        quantity: 120,
        lotNumber: "LOT-NA-2407",
        palletNumber: "PAL-NA-03",
        boxNumber: "BOX-003",
        unitPrice: 12.5,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-003",
        hfhShippingNumber: "HFH-2406-002",
        ndc: "00409-0882-02",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Global Health Trust",
        quantity: 150,
        lotNumber: "LOT-NA-2408",
        palletNumber: "PAL-NA-04",
        boxNumber: "BOX-004",
        unitPrice: 12.5,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-004",
        ndc: "00409-0882-02",
        notes: "No HFH number assigned yet.",
      },
    ],
  },
  {
    title: "Ceftriaxone 1g Injection Vials",
    unitType: "Tray",
    expirationDate: new Date("2026-10-31"),
    initialQuantity: 480,
    requestQuantity: 480,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 120,
        finalQuantity: 120,
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 90,
        finalQuantity: 90,
        comments: "Ensuring mobile physician kits are stocked.",
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 110,
        finalQuantity: 110,
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 80,
        finalQuantity: 80,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 80,
        finalQuantity: 80,
        priority: RequestPriority.MEDIUM,
      },
    ],
    lineItems: [
      {
        category: ItemCategory.MEDICATION,
        donorName: "Aid for All Foundation",
        quantity: 200,
        lotNumber: "LOT-CEF-1324",
        palletNumber: "PAL-CEF-01",
        boxNumber: "BOX-CEF-01",
        unitPrice: 18.75,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-005",
        hfhShippingNumber: "HFH-2406-003",
        ndc: "00409-7331-01",
        notes: "Cold-chain item.",
      },
      {
        category: ItemCategory.MEDICATION,
        donorName: "Aid for All Foundation",
        quantity: 160,
        lotNumber: "LOT-CEF-1325",
        palletNumber: "PAL-CEF-02",
        boxNumber: "BOX-CEF-02",
        unitPrice: 18.75,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-006",
        hfhShippingNumber: "HFH-2406-004",
        ndc: "00409-7331-01",
      },
      {
        category: ItemCategory.MEDICATION,
        donorName: "Aid for All Foundation",
        quantity: 120,
        lotNumber: "LOT-CEF-1326",
        palletNumber: "PAL-CEF-03",
        boxNumber: "BOX-CEF-03",
        unitPrice: 18.75,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-007",
        ndc: "00409-7331-01",
        maxRequestLimit: "Max 60 units per partner",
      },
    ],
  },
  {
    title: "Vitamin A Capsules 200,000 IU",
    unitType: "Bottle",
    expirationDate: new Date("2027-05-31"),
    initialQuantity: 1000,
    requestQuantity: 1000,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 260,
        finalQuantity: 260,
        comments: "Childhood supplementation week.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 210,
        finalQuantity: 210,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 220,
        finalQuantity: 220,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 170,
        finalQuantity: 170,
        comments: "Partnering with school health program.",
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 140,
        finalQuantity: 140,
        priority: RequestPriority.MEDIUM,
      },
    ],
    lineItems: [
      {
        category: ItemCategory.MEDICATION,
        donorName: "Health Lifeline",
        quantity: 220,
        lotNumber: "LOT-VA-881",
        palletNumber: "PAL-VA-01",
        boxNumber: "BOX-VA-01",
        unitPrice: 4.5,
        allowAllocations: true,
        visible: true,
        gik: true,
        donorShippingNumber: "DN-2405-008",
        hfhShippingNumber: "HFH-2406-005",
      },
      {
        category: ItemCategory.MEDICATION,
        donorName: "Health Lifeline",
        quantity: 180,
        lotNumber: "LOT-VA-882",
        palletNumber: "PAL-VA-01",
        boxNumber: "BOX-VA-02",
        unitPrice: 4.5,
        allowAllocations: true,
        visible: true,
        gik: true,
        donorShippingNumber: "DN-2405-009",
        hfhShippingNumber: "HFH-2406-005",
      },
      {
        category: ItemCategory.MEDICATION,
        donorName: "Health Lifeline",
        quantity: 210,
        lotNumber: "LOT-VA-883",
        palletNumber: "PAL-VA-02",
        boxNumber: "BOX-VA-03",
        unitPrice: 4.5,
        allowAllocations: true,
        visible: true,
        gik: true,
        donorShippingNumber: "DN-2405-010",
      },
      {
        category: ItemCategory.MEDICATION,
        donorName: "Health Lifeline",
        quantity: 190,
        lotNumber: "LOT-VA-884",
        palletNumber: "PAL-VA-02",
        boxNumber: "BOX-VA-04",
        unitPrice: 4.5,
        allowAllocations: false,
        visible: true,
        gik: true,
        donorShippingNumber: "DN-2405-011",
        notes: "Reserved for QA inspection.",
      },
      {
        category: ItemCategory.MEDICATION,
        donorName: "Health Lifeline",
        quantity: 200,
        lotNumber: "LOT-VA-885",
        palletNumber: "PAL-VA-03",
        boxNumber: "BOX-VA-05",
        unitPrice: 4.5,
        allowAllocations: true,
        visible: true,
        gik: true,
        donorShippingNumber: "DN-2405-012",
        hfhShippingNumber: "HFH-2406-006",
      },
    ],
  },
  {
    title: "Surgical Procedure Masks",
    unitType: "Case",
    expirationDate: new Date("2026-03-31"),
    initialQuantity: 1500,
    requestQuantity: 1500,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 400,
        finalQuantity: 400,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 320,
        finalQuantity: 320,
        comments: "Keeping mobile staff protected.",
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 360,
        finalQuantity: 360,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 220,
        finalQuantity: 220,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 200,
        finalQuantity: 200,
        comments: "Clinic reopening supply.",
        priority: RequestPriority.MEDIUM,
      },
    ],
    lineItems: [
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Better Future Supplies",
        quantity: 250,
        lotNumber: "LOT-MSK-503",
        palletNumber: "PAL-MSK-01",
        boxNumber: "BOX-MSK-01",
        unitPrice: 2.1,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-013",
        hfhShippingNumber: "HFH-2406-007",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Better Future Supplies",
        quantity: 260,
        lotNumber: "LOT-MSK-504",
        palletNumber: "PAL-MSK-01",
        boxNumber: "BOX-MSK-02",
        unitPrice: 2.1,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-014",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Better Future Supplies",
        quantity: 240,
        lotNumber: "LOT-MSK-505",
        palletNumber: "PAL-MSK-02",
        boxNumber: "BOX-MSK-03",
        unitPrice: 2.1,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-015",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Better Future Supplies",
        quantity: 260,
        lotNumber: "LOT-MSK-506",
        palletNumber: "PAL-MSK-02",
        boxNumber: "BOX-MSK-04",
        unitPrice: 2.1,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-016",
        hfhShippingNumber: "HFH-2406-008",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Better Future Supplies",
        quantity: 245,
        lotNumber: "LOT-MSK-507",
        palletNumber: "PAL-MSK-03",
        boxNumber: "BOX-MSK-05",
        unitPrice: 2.1,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-017",
        notes: "Outer cartons slightly dented.",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Better Future Supplies",
        quantity: 245,
        lotNumber: "LOT-MSK-508",
        palletNumber: "PAL-MSK-03",
        boxNumber: "BOX-MSK-06",
        unitPrice: 2.1,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-018",
        hfhShippingNumber: "HFH-2406-009",
      },
    ],
  },
  {
    title: "Comprehensive Lab Reagent Panels",
    unitType: "Kit",
    expirationDate: new Date("2025-10-15"),
    initialQuantity: 300,
    requestQuantity: 300,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 80,
        finalQuantity: 80,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 70,
        finalQuantity: 70,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 60,
        finalQuantity: 60,
        comments: "Lab automation pilot.",
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 50,
        finalQuantity: 50,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 40,
        finalQuantity: 40,
        priority: RequestPriority.MEDIUM,
      },
    ],
    lineItems: [
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Diagnostics Without Borders",
        quantity: 160,
        lotNumber: "LOT-LAB-210",
        palletNumber: "PAL-LAB-01",
        boxNumber: "BOX-LAB-01",
        unitPrice: 55.0,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-019",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Diagnostics Without Borders",
        quantity: 140,
        lotNumber: "LOT-LAB-211",
        palletNumber: "PAL-LAB-01",
        boxNumber: "BOX-LAB-02",
        unitPrice: 55.0,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-020",
        hfhShippingNumber: "HFH-2406-010",
        notes: "Requires temperature log review.",
      },
    ],
  },
  {
    title: "Ultrasound Transmission Gel Cases",
    unitType: "Case",
    expirationDate: new Date("2026-12-31"),
    initialQuantity: 400,
    requestQuantity: 400,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 90,
        finalQuantity: 90,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 85,
        finalQuantity: 85,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 85,
        finalQuantity: 85,
        comments: "Maternity unit upgrade.",
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 70,
        finalQuantity: 70,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 70,
        finalQuantity: 70,
        priority: RequestPriority.MEDIUM,
      },
    ],
    lineItems: [
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Imaging for Hope",
        quantity: 150,
        lotNumber: "LOT-GEL-701",
        palletNumber: "PAL-GEL-01",
        boxNumber: "BOX-GEL-01",
        unitPrice: 6.75,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-021",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Imaging for Hope",
        quantity: 130,
        lotNumber: "LOT-GEL-702",
        palletNumber: "PAL-GEL-01",
        boxNumber: "BOX-GEL-02",
        unitPrice: 6.75,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-022",
        hfhShippingNumber: "HFH-2406-011",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Imaging for Hope",
        quantity: 120,
        lotNumber: "LOT-GEL-703",
        palletNumber: "PAL-GEL-02",
        boxNumber: "BOX-GEL-03",
        unitPrice: 6.75,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2405-023",
        hfhShippingNumber: "HFH-2406-012",
        notes: "HFH number assigned after customs inspection.",
      },
    ],
  },
];

const archivedGeneralItems: GeneralItemSeed[] = [
  {
    title: "Azithromycin 250mg Tablets",
    unitType: "Bottle",
    expirationDate: new Date("2026-02-28"),
    initialQuantity: 420,
    requestQuantity: 455,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 110,
        finalQuantity: 100,
        comments: "Community pneumonia cases remain high.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 95,
        finalQuantity: 85,
        comments: "Mobile teams preparing for rainy season spikes.",
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 105,
        finalQuantity: 95,
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 80,
        finalQuantity: 70,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 65,
        finalQuantity: 60,
        comments: "Covering satellite rural clinics.",
        priority: RequestPriority.MEDIUM,
      },
    ],
    lineItems: [
      {
        category: ItemCategory.MEDICATION,
        donorName: "Med Relief International",
        quantity: 160,
        lotNumber: "LOT-AZI-2401",
        palletNumber: "PAL-AZI-01",
        boxNumber: "BOX-AZI-01",
        unitPrice: 14.8,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2404-101",
        hfhShippingNumber: "HFH-2405-041",
        ndc: "00378-3125-60",
      },
      {
        category: ItemCategory.MEDICATION,
        donorName: "Med Relief International",
        quantity: 140,
        lotNumber: "LOT-AZI-2402",
        palletNumber: "PAL-AZI-01",
        boxNumber: "BOX-AZI-02",
        unitPrice: 14.8,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2404-102",
        notes: "Packed with desiccant packets.",
      },
      {
        category: ItemCategory.MEDICATION,
        donorName: "Med Relief International",
        quantity: 120,
        lotNumber: "LOT-AZI-2403",
        palletNumber: "PAL-AZI-02",
        boxNumber: "BOX-AZI-03",
        unitPrice: 14.8,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2404-103",
        maxRequestLimit: "Limit 80 bottles per partner",
      },
    ],
  },
  {
    title: "Disposable Surgical Gown Packs",
    unitType: "Case",
    expirationDate: new Date("2027-04-30"),
    initialQuantity: 300,
    requestQuantity: 325,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 85,
        finalQuantity: 80,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 60,
        finalQuantity: 55,
        comments: "Covering surgical outreach rotations.",
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 75,
        finalQuantity: 70,
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 55,
        finalQuantity: 45,
        comments: "Supporting postpartum ward renovations.",
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 50,
        finalQuantity: 45,
        priority: RequestPriority.MEDIUM,
      },
    ],
    lineItems: [
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "CareWear Collective",
        quantity: 120,
        lotNumber: "LOT-GOWN-4201",
        palletNumber: "PAL-GOWN-01",
        boxNumber: "BOX-GOWN-01",
        unitPrice: 9.25,
        allowAllocations: true,
        visible: true,
        gik: true,
        donorShippingNumber: "DN-2404-104",
        hfhShippingNumber: "HFH-2405-042",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "CareWear Collective",
        quantity: 100,
        lotNumber: "LOT-GOWN-4202",
        palletNumber: "PAL-GOWN-02",
        boxNumber: "BOX-GOWN-02",
        unitPrice: 9.25,
        allowAllocations: true,
        visible: true,
        gik: true,
        donorShippingNumber: "DN-2404-105",
        notes: "Preferred sizes mix requested by partners.",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "CareWear Collective",
        quantity: 80,
        lotNumber: "LOT-GOWN-4203",
        palletNumber: "PAL-GOWN-02",
        boxNumber: "BOX-GOWN-03",
        unitPrice: 9.25,
        allowAllocations: false,
        visible: true,
        gik: true,
        donorShippingNumber: "DN-2404-106",
        notes: "Held for quality review before release.",
      },
    ],
  },
  {
    title: "IV Rehydration Starter Sets",
    unitType: "Kit",
    initialQuantity: 260,
    requestQuantity: 290,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 70,
        finalQuantity: 65,
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 65,
        finalQuantity: 60,
        comments: "Preparedness for cholera flare-ups.",
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 60,
        finalQuantity: 55,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 50,
        finalQuantity: 45,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 45,
        finalQuantity: 40,
        priority: RequestPriority.MEDIUM,
      },
    ],
    lineItems: [
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Global Hydration Network",
        quantity: 90,
        lotNumber: "LOT-INF-3301",
        palletNumber: "PAL-INF-01",
        boxNumber: "BOX-INF-01",
        unitPrice: 11.5,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2404-107",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Global Hydration Network",
        quantity: 80,
        lotNumber: "LOT-INF-3302",
        palletNumber: "PAL-INF-01",
        boxNumber: "BOX-INF-02",
        unitPrice: 11.5,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2404-108",
        maxRequestLimit: "Allocate in bundles of 20 kits.",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "Global Hydration Network",
        quantity: 90,
        lotNumber: "LOT-INF-3303",
        palletNumber: "PAL-INF-02",
        boxNumber: "BOX-INF-03",
        unitPrice: 11.5,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2404-109",
        notes: "Includes replacement tubing.",
      },
    ],
  },
  {
    title: "Cold Chain Vaccine Carriers",
    unitType: "Unit",
    initialQuantity: 140,
    requestQuantity: 168,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 40,
        finalQuantity: 38,
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 35,
        finalQuantity: 32,
        comments: "Supports cold chain on long deployments.",
        priority: RequestPriority.HIGH,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 38,
        finalQuantity: 36,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 28,
        finalQuantity: 25,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 27,
        finalQuantity: 24,
        priority: RequestPriority.MEDIUM,
      },
    ],
    lineItems: [
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "CoolChain Alliance",
        quantity: 50,
        lotNumber: "LOT-COLD-2101",
        palletNumber: "PAL-COLD-01",
        boxNumber: "BOX-COLD-01",
        unitPrice: 62.5,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2404-110",
        hfhShippingNumber: "HFH-2405-043",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "CoolChain Alliance",
        quantity: 45,
        lotNumber: "LOT-COLD-2102",
        palletNumber: "PAL-COLD-01",
        boxNumber: "BOX-COLD-02",
        unitPrice: 62.5,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2404-111",
        notes: "Ice packs preconditioned on arrival.",
      },
      {
        category: ItemCategory.MEDICAL_SUPPLY,
        donorName: "CoolChain Alliance",
        quantity: 45,
        lotNumber: "LOT-COLD-2103",
        palletNumber: "PAL-COLD-02",
        boxNumber: "BOX-COLD-03",
        unitPrice: 62.5,
        allowAllocations: true,
        visible: true,
        gik: false,
        donorShippingNumber: "DN-2404-112",
        notes: "Additional shoulder straps included.",
      },
    ],
  },
  {
    title: "High-Energy Nutrition Bars",
    unitType: "Case",
    expirationDate: new Date("2026-12-31"),
    initialQuantity: 540,
    requestQuantity: 600,
    requests: [
      {
        partnerKey: "hope_medical_center",
        quantity: 150,
        finalQuantity: 140,
        comments: "Supplementing inpatient nutrition program.",
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "mobile_response_unit",
        quantity: 130,
        finalQuantity: 120,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "les_cayes_hospital",
        quantity: 140,
        finalQuantity: 135,
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "jeremie_network",
        quantity: 100,
        finalQuantity: 90,
        comments: "Support for hurricane-displaced families.",
        priority: RequestPriority.MEDIUM,
      },
      {
        partnerKey: "cap_haitien_wellness",
        quantity: 80,
        finalQuantity: 70,
        priority: RequestPriority.MEDIUM,
      },
    ],
    lineItems: [
      {
        category: ItemCategory.NON_MEDICAL,
        donorName: "Resilience Relief",
        quantity: 150,
        lotNumber: "LOT-NUT-5501",
        palletNumber: "PAL-NUT-01",
        boxNumber: "BOX-NUT-01",
        unitPrice: 3.6,
        allowAllocations: true,
        visible: true,
        gik: true,
        donorShippingNumber: "DN-2404-113",
        notes: "Variety pack flavors.",
      },
      {
        category: ItemCategory.NON_MEDICAL,
        donorName: "Resilience Relief",
        quantity: 140,
        lotNumber: "LOT-NUT-5502",
        palletNumber: "PAL-NUT-01",
        boxNumber: "BOX-NUT-02",
        unitPrice: 3.6,
        allowAllocations: true,
        visible: true,
        gik: true,
        donorShippingNumber: "DN-2404-114",
        hfhShippingNumber: "HFH-2405-044",
      },
      {
        category: ItemCategory.NON_MEDICAL,
        donorName: "Resilience Relief",
        quantity: 130,
        lotNumber: "LOT-NUT-5503",
        palletNumber: "PAL-NUT-02",
        boxNumber: "BOX-NUT-03",
        unitPrice: 3.6,
        allowAllocations: true,
        visible: true,
        gik: true,
        donorShippingNumber: "DN-2404-115",
      },
      {
        category: ItemCategory.NON_MEDICAL,
        donorName: "Resilience Relief",
        quantity: 120,
        lotNumber: "LOT-NUT-5504",
        palletNumber: "PAL-NUT-02",
        boxNumber: "BOX-NUT-04",
        unitPrice: 3.6,
        allowAllocations: true,
        visible: true,
        gik: true,
        donorShippingNumber: "DN-2404-116",
        notes: "Short-dated but stable for six months.",
      },
    ],
  },
];

const shippingStatusSeeds = [
  {
    donorShippingNumber: "DN-2405-001",
    hfhShippingNumber: "HFH-2406-001",
    value: ShipmentStatus.LOAD_ON_SHIP_AIR,
  },
  {
    donorShippingNumber: "DN-2405-003",
    hfhShippingNumber: "HFH-2406-002",
    value: ShipmentStatus.ARRIVED_IN_HAITI,
  },
  {
    donorShippingNumber: "DN-2405-006",
    hfhShippingNumber: "HFH-2406-004",
    value: ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR,
  },
  {
    donorShippingNumber: "DN-2405-009",
    hfhShippingNumber: "HFH-2406-005",
    value: ShipmentStatus.ARRIVED_AT_DEPO,
  },
  {
    donorShippingNumber: "DN-2405-018",
    hfhShippingNumber: "HFH-2406-009",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  },
  {
    donorShippingNumber: "DN-2405-022",
    hfhShippingNumber: "HFH-2406-011",
    value: ShipmentStatus.CLEARED_CUSTOMS,
  },
  {
    donorShippingNumber: "DN-2405-023",
    hfhShippingNumber: "HFH-2406-012",
    value: ShipmentStatus.INVENTORIES,
  },
  {
    donorShippingNumber: "DN-2404-101",
    hfhShippingNumber: "HFH-2405-041",
    value: ShipmentStatus.ARRIVED_IN_HAITI,
  },
  {
    donorShippingNumber: "DN-2404-105",
    hfhShippingNumber: "HFH-2405-042",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  },
  {
    donorShippingNumber: "DN-2404-110",
    hfhShippingNumber: "HFH-2405-043",
    value: ShipmentStatus.CLEARED_CUSTOMS,
  },
  {
    donorShippingNumber: "DN-2404-114",
    hfhShippingNumber: "HFH-2405-044",
    value: ShipmentStatus.ARRIVED_AT_DEPO,
  },
];

async function buildSeedData() {
  await db.$transaction(async (tx) => {
    await tx.allocation.deleteMany();
    await tx.generalItemRequest.deleteMany();
    await tx.lineItem.deleteMany();
    await tx.generalItem.deleteMany();
    await tx.donorOffer.deleteMany();
    await tx.distribution.deleteMany();
    await tx.signOff.deleteMany();
    await tx.wishlist.deleteMany();
    await tx.shippingStatus.deleteMany();
    await tx.userInvite.deleteMany();
    await tx.user.deleteMany();
    await tx.allocation.deleteMany();
    await tx.generalItemRequest.deleteMany();
    await tx.descriptionLookup.deleteMany();

    const passwordHash = await hash("root");

    await Promise.all([
      tx.user.create({
      data: {
        email: "superadmin@test.com",
        name: "Super Admin",
          passwordHash,
          type: UserType.SUPER_ADMIN,
          enabled: true,
          pending: false,
      },
      }),
      tx.user.create({
      data: {
        email: "admin@test.com",
          name: "Admin User",
          passwordHash,
        type: UserType.ADMIN,
          enabled: true,
          pending: false,
      },
      }),
      tx.user.create({
      data: {
        email: "staff@test.com",
          name: "Staff Member",
          passwordHash,
        type: UserType.STAFF,
          enabled: true,
          pending: false,
        },
      }),
    ]);

    const partnerRecords = [];
    for (const seed of partnerSeeds) {
      const partner = await tx.user.create({
      data: {
          email: seed.email,
          name: seed.name,
          passwordHash,
          type: UserType.PARTNER,
          tag: seed.tag,
          enabled: seed.pending ? false : true,
          pending: seed.pending ?? false,
          partnerDetails: seed.partnerDetails,
      },
    });
      partnerRecords.push({ seed, partner });
    }

    const pendingPartnerEntry = partnerRecords.find(
      ({ seed }) => seed.pending
    );
    if (pendingPartnerEntry) {
    await tx.userInvite.create({
      data: {
          userId: pendingPartnerEntry.partner.id,
          token: "partner-onboarding-token",
          expiration: addDays(30),
      },
    });
    }

    const partnerMap = new Map(
      partnerRecords.map(({ seed, partner }) => [seed.key, partner])
    );

    const activePartners = partnerRecords
      .filter(({ seed }) => !seed.pending)
      .map(({ partner }) => partner);

    const buildGeneralItemData = (item: GeneralItemSeed) => ({
      title: item.title,
      unitType: item.unitType,
      expirationDate: item.expirationDate,
      initialQuantity: item.initialQuantity,
      requestQuantity:
        item.requestQuantity ??
        item.requests.reduce(
          (total, req) => total + (req.finalQuantity ?? req.quantity),
          0
        ),
        requests: {
        create: item.requests.map((req) => {
          const partner = partnerMap.get(req.partnerKey);
          if (!partner) {
            throw new Error(`Unknown partner key ${req.partnerKey}`);
          }

          return {
            partnerId: partner.id,
            quantity: req.quantity,
            finalQuantity: req.finalQuantity ?? req.quantity,
            comments: req.comments ?? null,
            priority: req.priority ?? null,
          };
        }),
      },
      ...(item.lineItems
        ? {
            items: {
              create: item.lineItems.map((lineItem) => ({
                category: lineItem.category,
                donorName: lineItem.donorName,
                quantity: lineItem.quantity,
                lotNumber: lineItem.lotNumber,
                palletNumber: lineItem.palletNumber,
                boxNumber: lineItem.boxNumber,
                unitPrice: lineItem.unitPrice,
                allowAllocations: lineItem.allowAllocations,
                visible: lineItem.visible,
                gik: lineItem.gik,
                maxRequestLimit: lineItem.maxRequestLimit ?? null,
                donorShippingNumber: lineItem.donorShippingNumber ?? null,
                hfhShippingNumber: lineItem.hfhShippingNumber ?? null,
                ndc: lineItem.ndc ?? null,
                notes: lineItem.notes ?? null,
              })),
            },
          }
        : {}),
    });

    await tx.donorOffer.create({
      data: {
          state: DonorOfferState.UNFINALIZED,
        offerName: "Q3 Medical Support (Draft)",
        donorName: "Global Health Trust",
        partnerResponseDeadline: addDays(14),
        donorResponseDeadline: addDays(28),
          partnerVisibilities: {
          connect: activePartners.map((partner) => ({ id: partner.id })),
        },
          items: {
          create: unfinalizedGeneralItems.map(buildGeneralItemData),
        },
      },
    });

    await tx.donorOffer.create({
      data: {
        state: DonorOfferState.FINALIZED,
        offerName: "Q2 Emergency Allocation (Finalized)",
        donorName: "Aid for All Foundation",
        partnerResponseDeadline: addDays(-21),
        donorResponseDeadline: addDays(-7),
          partnerVisibilities: {
          connect: activePartners.map((partner) => ({ id: partner.id })),
        },
          items: {
          create: finalizedGeneralItems.map(buildGeneralItemData),
        },
      },
    });

    const archivedDonorOffer = await tx.donorOffer.create({
      data: {
        state: DonorOfferState.ARCHIVED,
        offerName: "Q1 Storm Recovery Allocation (Archived)",
        donorName: "Med Relief International Coalition",
        partnerResponseDeadline: addDays(-120),
        donorResponseDeadline: addDays(-90),
          partnerVisibilities: {
          connect: activePartners.map((partner) => ({ id: partner.id })),
        },
        items: {
          create: archivedGeneralItems.map(buildGeneralItemData),
        },
      },
      include: {
          items: {
          include: {
            items: true,
          },
        },
      },
    });

    const archivedLineItemMap = new Map(
      archivedDonorOffer.items.flatMap((generalItem) =>
        generalItem.items.map((lineItem) => [lineItem.boxNumber, lineItem])
      )
    );

    const archivedAllocationsPlan = [
      {
        partnerKey: "hope_medical_center",
        lineItemBoxes: ["BOX-AZI-01", "BOX-INF-02"],
      },
      {
        partnerKey: "mobile_response_unit",
        lineItemBoxes: ["BOX-COLD-01"],
      },
      {
        partnerKey: "les_cayes_hospital",
        lineItemBoxes: ["BOX-GOWN-02"],
      },
      {
        partnerKey: "jeremie_network",
        lineItemBoxes: ["BOX-NUT-02"],
      },
    ] as const;

    for (const allocationEntry of archivedAllocationsPlan) {
      const partner = partnerMap.get(allocationEntry.partnerKey);
      if (!partner) {
        throw new Error(
          `Unknown partner key ${allocationEntry.partnerKey} while creating archived allocations`
        );
      }

      const distribution = await tx.distribution.create({
        data: {
          partnerId: partner.id,
          pending: false,
        },
      });

      for (const boxNumber of allocationEntry.lineItemBoxes) {
        const lineItem = archivedLineItemMap.get(boxNumber);
        if (!lineItem) {
          throw new Error(
            `Missing archived line item for box number ${boxNumber}`
          );
        }

        await tx.allocation.create({
          data: {
            lineItemId: lineItem.id,
            distributionId: distribution.id,
            partnerId: partner.id,
          },
        });
      }
    }

    await tx.shippingStatus.createMany({ data: shippingStatusSeeds });
  });
}

buildSeedData()
  .then(() => {
    console.info("Database seeded with comprehensive demo data.");
    exit(0);
  })
  .catch((error) => {
    console.error("Error seeding database", error);
    exit(1);
  });

import { exit } from "process";
import { hash } from "argon2";
import {
  DonorOfferState,
  ItemCategory,
  ItemType,
  RequestPriority,
  ShipmentStatus,
  UserType,
} from "@prisma/client";

import { db } from "@/db";
import type { Prisma } from "@prisma/client";
import { MatchingService } from "@/services/matchingService";
import StreamIoService from "@/services/streamIoService";

const addDays = (daysFromToday: number) => {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + daysFromToday);
  return base;
};

const existingStreamTokens: { [email: string]: string } = {};

async function fetchExistingStreamTokens() {
  const users = await db.user.findMany({
    where: {
      streamUserToken: {
        not: null,
      },
    },
  });

  users.forEach((user) => {
    existingStreamTokens[user.email] = user.streamUserToken!;
  });
}

/**
 * Creates a user with a Stream Chat user token in the DB
 */
async function createUser(
  user: Omit<Prisma.UserCreateInput, "streamUserToken">
): Promise<ReturnType<typeof db.user.create>> {
  const streamUser = existingStreamTokens[user.email]
    ? {
        userId: StreamIoService.getUserIdFromUser({ email: user.email }),
        userToken: existingStreamTokens[user.email],
      }
    : await StreamIoService.createUser(user);

  return await db.user.create({
    data: {
      ...user,
      streamUserId: streamUser.userId,
      streamUserToken: streamUser.userToken,
    },
  });
}

const buildPartnerDetails = (
  siteName: string,
  department: string,
  contactPrefix: string,
  latitude: number,
  longitude: number
): Prisma.JsonObject =>
  ({
    siteName,
    address: `${siteName}, ${department}, Haiti`,
    department,
    latitude,
    longitude,
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

async function buildSeedData() {
  await fetchExistingStreamTokens();

  await db.allocation.deleteMany();
  await db.generalItemRequest.deleteMany();
  await db.lineItem.deleteMany();
  await db.generalItem.deleteMany();
  await db.donorOffer.deleteMany();
  await db.distribution.deleteMany();
  await db.signOff.deleteMany();
  await db.wishlist.deleteMany();
  await db.shippingStatus.deleteMany();
  await db.userInvite.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await hash("root");

  // Create staff users with Stream credentials
  const superAdmin = await createUser({
    email: "superadmin@test.com",
    name: "Super Admin",
    passwordHash,
    type: UserType.STAFF,
    enabled: true,
    pending: false,
    isSuper: true,
    userRead: true,
    userWrite: true,
    itemNotify: true,
    offerWrite: true,
    requestRead: true,
    requestWrite: true,
    allocationRead: true,
    allocationWrite: true,
    archivedRead: true,
    distributionRead: true,
    distributionWrite: true,
    shipmentRead: true,
    shipmentWrite: true,
    signoffWrite: true,
    wishlistRead: true,
    supportRead: true,
    supportWrite: true,
    supportNotify: true,
  });

  const distributionLead = await createUser({
    email: "distribution@test.com",
    name: "Distribution Lead",
    passwordHash,
    type: UserType.STAFF,
    enabled: true,
    pending: false,
    userRead: false,
    userWrite: false,
    requestRead: true,
    allocationRead: true,
    allocationWrite: true,
    archivedRead: true,
    distributionRead: true,
    distributionWrite: true,
    shipmentRead: true,
    shipmentWrite: true,
    signoffWrite: true,
    wishlistRead: false,
    offerWrite: false,
    requestWrite: false,
    itemNotify: false,
    supportRead: true,
    supportWrite: false,
    supportNotify: false,
  });

  const donorOfferManager = await createUser({
    email: "donoroffers@test.com",
    name: "Donor Offer Manager",
    passwordHash,
    type: UserType.STAFF,
    enabled: true,
    pending: false,
    requestRead: true,
    requestWrite: true,
    allocationRead: true,
    allocationWrite: true,
    archivedRead: true,
    offerWrite: true,
    itemNotify: true,
    wishlistRead: true,
    supportRead: true,
    supportWrite: true,
    supportNotify: true,
  });

  const readOnlyStaff = await createUser({
    email: "readonly@test.com",
    name: "Read Only Staff",
    passwordHash,
    type: UserType.STAFF,
    enabled: true,
    pending: false,
    userRead: true,
    requestRead: true,
    allocationRead: true,
    archivedRead: true,
    distributionRead: true,
    shipmentRead: true,
    wishlistRead: true,
    supportRead: true,
    itemNotify: true,
    supportNotify: true,
  });

  // Create partner users
  const internalPartner = await createUser({
    email: "internal@test.com",
    name: "Hope Medical Center",
    passwordHash,
    type: UserType.PARTNER,
    tag: "internal",
    enabled: true,
    pending: false,
    partnerDetails: buildPartnerDetails(
      "Hope Medical Center",
      "Ouest",
      "hopecenter",
      18.5392,
      -72.335
    ),
  });

  const externalPartner = await createUser({
    email: "external@test.com",
    name: "Les Cayes Community Hospital",
    passwordHash,
    type: UserType.PARTNER,
    tag: "external",
    enabled: true,
    pending: false,
    partnerDetails: buildPartnerDetails(
      "Les Cayes Community Hospital",
      "Sud",
      "lescayes",
      18.25,
      -73.75
    ),
  });

  console.log("✓ Created users");

  // ============================================================================
  // Unfinalized Donor Offer (5 general items, no line items)
  // ============================================================================
  const unfinalizedOffer = await db.donorOffer.create({
    data: {
      state: DonorOfferState.UNFINALIZED,
      offerName: "Q3 Medical Support",
      donorName: "Global Health Trust",
      partnerResponseDeadline: addDays(14),
      donorResponseDeadline: addDays(28),
      partnerVisibilities: {
        connect: [{ id: internalPartner.id }, { id: externalPartner.id }],
      },
      items: {
        create: [
          {
            title: "Amoxicillin 500mg Capsules",
            unitType: "Bottle",
            expirationDate: new Date("2026-06-30"),
            initialQuantity: 500,
            weight: 10,
            type: ItemType.MEDICATION,
            category: ItemCategory.ANTIBIOTIC,
          },
          {
            title: "Oral Rehydration Salt Packets",
            unitType: "Case",
            expirationDate: new Date("2025-12-31"),
            initialQuantity: 300,
            weight: 15,
            type: ItemType.MEDICATION_SUPPLEMENT,
            category: ItemCategory.FLUID_REPLENISHMENT,
          },
          {
            title: "Disposable Syringes 5ml",
            unitType: "Case",
            expirationDate: new Date("2027-01-15"),
            initialQuantity: 800,
            weight: 8,
            type: ItemType.NON_MEDICATION,
            category: ItemCategory.NEEDLES_SYRINGES,
          },
          {
            title: "Sterile Surgical Gloves Size M",
            unitType: "Case",
            expirationDate: new Date("2026-11-20"),
            initialQuantity: 600,
            weight: 10,
            type: ItemType.NON_MEDICATION,
            category: ItemCategory.PPE,
          },
          {
            title: "Prenatal Vitamins 180ct Bottles",
            unitType: "Bottle",
            expirationDate: new Date("2025-09-30"),
            initialQuantity: 400,
            weight: 10,
            type: ItemType.MEDICATION_SUPPLEMENT,
            category: ItemCategory.OB_GYN,
          },
        ],
      },
    },
  });

  console.log("✓ Created unfinalized donor offer");

  // ============================================================================
  // Finalized Donor Offer (5 general items WITH line items and requests)
  // ============================================================================
  const finalizedOffer = await db.donorOffer.create({
    data: {
      state: DonorOfferState.FINALIZED,
      offerName: "Q2 Emergency Allocation",
      donorName: "Aid for All Foundation",
      partnerResponseDeadline: addDays(-21),
      donorResponseDeadline: addDays(-7),
      partnerVisibilities: {
        connect: [{ id: internalPartner.id }, { id: externalPartner.id }],
      },
    },
  });

  // General Item 1 with line items
  const finalizedItem1 = await db.generalItem.create({
    data: {
      donorOfferId: finalizedOffer.id,
      title: "Ibuprofen 200mg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-08-31"),
      initialQuantity: 400,
      requestQuantity: 400,
      weight: 12,
      type: ItemType.MEDICATION,
      category: ItemCategory.PAIN_RELIEVERS,
      items: {
        create: [
          {
            donorName: "Aid for All Foundation",
            quantity: 200,
            lotNumber: "LOT-IBU-001",
            palletNumber: "PAL-01",
            boxNumber: "BOX-001",
            unitPrice: 5.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2024-001",
            hfhShippingNumber: "HFH-2024-001",
          },
          {
            donorName: "Aid for All Foundation",
            quantity: 200,
            lotNumber: "LOT-IBU-002",
            palletNumber: "PAL-01",
            boxNumber: "BOX-002",
            unitPrice: 5.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2024-002",
            hfhShippingNumber: "HFH-2024-002",
          },
        ],
      },
    },
  });

  // General Item 2
  const finalizedItem2 = await db.generalItem.create({
    data: {
      donorOfferId: finalizedOffer.id,
      title: "Gauze Pads 4x4",
      unitType: "Box",
      expirationDate: new Date("2027-03-31"),
      initialQuantity: 600,
      requestQuantity: 600,
      weight: 8,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.WOUND_CARE,
      items: {
        create: [
          {
            donorName: "Aid for All Foundation",
            quantity: 300,
            lotNumber: "LOT-GAU-001",
            palletNumber: "PAL-02",
            boxNumber: "BOX-003",
            unitPrice: 3.0,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2024-003",
            hfhShippingNumber: "HFH-2024-003",
          },
          {
            donorName: "Aid for All Foundation",
            quantity: 300,
            lotNumber: "LOT-GAU-002",
            palletNumber: "PAL-02",
            boxNumber: "BOX-004",
            unitPrice: 3.0,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2024-004",
            hfhShippingNumber: "HFH-2024-004",
          },
        ],
      },
    },
  });

  // General Item 3
  const finalizedItem3 = await db.generalItem.create({
    data: {
      donorOfferId: finalizedOffer.id,
      title: "N95 Respirator Masks",
      unitType: "Box",
      expirationDate: new Date("2026-12-31"),
      initialQuantity: 500,
      requestQuantity: 500,
      weight: 5,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.PPE,
      items: {
        create: [
          {
            donorName: "Aid for All Foundation",
            quantity: 250,
            lotNumber: "LOT-N95-001",
            palletNumber: "PAL-03",
            boxNumber: "BOX-005",
            unitPrice: 15.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2024-005",
            hfhShippingNumber: "HFH-2024-005",
          },
          {
            donorName: "Aid for All Foundation",
            quantity: 250,
            lotNumber: "LOT-N95-002",
            palletNumber: "PAL-03",
            boxNumber: "BOX-006",
            unitPrice: 15.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2024-006",
            hfhShippingNumber: "HFH-2024-006",
          },
        ],
      },
    },
  });

  // General Item 4
  const finalizedItem4 = await db.generalItem.create({
    data: {
      donorOfferId: finalizedOffer.id,
      title: "Antibiotic Ointment",
      unitType: "Tube",
      expirationDate: new Date("2025-11-30"),
      initialQuantity: 350,
      requestQuantity: 350,
      weight: 6,
      type: ItemType.MEDICATION,
      category: ItemCategory.ANTIBIOTIC,
      items: {
        create: [
          {
            donorName: "Aid for All Foundation",
            quantity: 175,
            lotNumber: "LOT-ANT-001",
            palletNumber: "PAL-04",
            boxNumber: "BOX-007",
            unitPrice: 4.25,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2024-007",
            hfhShippingNumber: "HFH-2024-007",
          },
          {
            donorName: "Aid for All Foundation",
            quantity: 175,
            lotNumber: "LOT-ANT-002",
            palletNumber: "PAL-04",
            boxNumber: "BOX-008",
            unitPrice: 4.25,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2024-008",
            hfhShippingNumber: "HFH-2024-008",
          },
        ],
      },
    },
  });

  // General Item 5
  const finalizedItem5 = await db.generalItem.create({
    data: {
      donorOfferId: finalizedOffer.id,
      title: "Blood Pressure Cuffs",
      unitType: "Unit",
      expirationDate: new Date("2028-06-30"),
      initialQuantity: 100,
      requestQuantity: 100,
      weight: 8,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.CARDIOVASCULAR,
      items: {
        create: [
          {
            donorName: "Aid for All Foundation",
            quantity: 50,
            lotNumber: "LOT-BPC-001",
            palletNumber: "PAL-05",
            boxNumber: "BOX-009",
            unitPrice: 25.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2024-009",
            hfhShippingNumber: "HFH-2024-009",
          },
          {
            donorName: "Aid for All Foundation",
            quantity: 50,
            lotNumber: "LOT-BPC-002",
            palletNumber: "PAL-05",
            boxNumber: "BOX-010",
            unitPrice: 25.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2024-010",
            hfhShippingNumber: "HFH-2024-010",
          },
        ],
      },
    },
  });

  // Create requests from both partners for finalized items
  await db.generalItemRequest.createMany({
    data: [
      // Internal Partner requests
      {
        generalItemId: finalizedItem1.id,
        partnerId: internalPartner.id,
        quantity: 200,
        finalQuantity: 200,
        comments: "For pain management program",
        priority: RequestPriority.HIGH,
      },
      {
        generalItemId: finalizedItem2.id,
        partnerId: internalPartner.id,
        quantity: 300,
        finalQuantity: 300,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: finalizedItem3.id,
        partnerId: internalPartner.id,
        quantity: 250,
        finalQuantity: 250,
        comments: "COVID-19 protection",
        priority: RequestPriority.HIGH,
      },
      // External Partner requests
      {
        generalItemId: finalizedItem1.id,
        partnerId: externalPartner.id,
        quantity: 200,
        finalQuantity: 200,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: finalizedItem2.id,
        partnerId: externalPartner.id,
        quantity: 300,
        finalQuantity: 300,
        comments: "Wound care supplies needed",
        priority: RequestPriority.HIGH,
      },
      {
        generalItemId: finalizedItem4.id,
        partnerId: externalPartner.id,
        quantity: 175,
        finalQuantity: 175,
        priority: RequestPriority.MEDIUM,
      },
    ],
  });

  console.log("✓ Created finalized donor offer with requests");

  // ============================================================================
  // Archived Donor Offer (with allocations and distributions)
  // ============================================================================
  const archivedOffer = await db.donorOffer.create({
    data: {
      state: DonorOfferState.ARCHIVED,
      offerName: "Q1 Storm Recovery Allocation",
      donorName: "Med Relief International",
      partnerResponseDeadline: addDays(-120),
      donorResponseDeadline: addDays(-90),
      archivedAt: addDays(-80),
      partnerVisibilities: {
        connect: [{ id: internalPartner.id }, { id: externalPartner.id }],
      },
    },
  });

  // Create 5 general items for archived offer
  const archivedItem1 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Azithromycin 250mg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-02-28"),
      initialQuantity: 300,
      requestQuantity: 300,
      weight: 10,
      type: ItemType.MEDICATION,
      category: ItemCategory.ANTIBIOTIC,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-AZI-001",
            palletNumber: "PAL-A1",
            boxNumber: "BOX-A001",
            unitPrice: 12.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-101",
            hfhShippingNumber: "HFH-2023-101",
          },
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-AZI-002",
            palletNumber: "PAL-A1",
            boxNumber: "BOX-A002",
            unitPrice: 12.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-102",
            hfhShippingNumber: "HFH-2023-102",
          },
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-AZI-003",
            palletNumber: "PAL-A1",
            boxNumber: "BOX-A003",
            unitPrice: 12.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-103",
            hfhShippingNumber: "HFH-2023-103",
          },
        ],
      },
    },
  });

  const archivedItem2 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Surgical Gown Packs",
      unitType: "Case",
      expirationDate: new Date("2027-04-30"),
      initialQuantity: 200,
      requestQuantity: 200,
      weight: 15,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.PPE,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-GOW-001",
            palletNumber: "PAL-A2",
            boxNumber: "BOX-A004",
            unitPrice: 8.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-104",
            hfhShippingNumber: "HFH-2023-104",
          },
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-GOW-002",
            palletNumber: "PAL-A2",
            boxNumber: "BOX-A005",
            unitPrice: 8.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-105",
            hfhShippingNumber: "HFH-2023-105",
          },
        ],
      },
    },
  });

  const archivedItem3 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "IV Rehydration Kits",
      unitType: "Kit",
      initialQuantity: 150,
      requestQuantity: 150,
      weight: 12,
      type: ItemType.MEDICATION,
      category: ItemCategory.FLUID_REPLENISHMENT,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 75,
            lotNumber: "LOT-IV-001",
            palletNumber: "PAL-A3",
            boxNumber: "BOX-A006",
            unitPrice: 10.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-106",
            hfhShippingNumber: "HFH-2023-106",
          },
          {
            donorName: "Med Relief International",
            quantity: 75,
            lotNumber: "LOT-IV-002",
            palletNumber: "PAL-A3",
            boxNumber: "BOX-A007",
            unitPrice: 10.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-107",
            hfhShippingNumber: "HFH-2023-107",
          },
        ],
      },
    },
  });

  const archivedItem4 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Thermometers Digital",
      unitType: "Unit",
      initialQuantity: 80,
      requestQuantity: 80,
      weight: 5,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.GENERAL,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 40,
            lotNumber: "LOT-THM-001",
            palletNumber: "PAL-A4",
            boxNumber: "BOX-A008",
            unitPrice: 18.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-108",
            hfhShippingNumber: "HFH-2023-108",
          },
          {
            donorName: "Med Relief International",
            quantity: 40,
            lotNumber: "LOT-THM-002",
            palletNumber: "PAL-A4",
            boxNumber: "BOX-A009",
            unitPrice: 18.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-109",
            hfhShippingNumber: "HFH-2023-109",
          },
        ],
      },
    },
  });

  const archivedItem5 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Nutrition Bars",
      unitType: "Case",
      expirationDate: new Date("2026-12-31"),
      initialQuantity: 400,
      requestQuantity: 400,
      weight: 15,
      type: ItemType.MEDICATION_SUPPLEMENT,
      category: ItemCategory.NUTRITION_SUPPLEMENTS,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-NUT-001",
            palletNumber: "PAL-A5",
            boxNumber: "BOX-A010",
            unitPrice: 3.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-110",
            hfhShippingNumber: "HFH-2023-110",
          },
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-NUT-002",
            palletNumber: "PAL-A5",
            boxNumber: "BOX-A011",
            unitPrice: 3.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-111",
            hfhShippingNumber: "HFH-2023-111",
          },
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-NUT-003",
            palletNumber: "PAL-A5",
            boxNumber: "BOX-A012",
            unitPrice: 3.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-112",
            hfhShippingNumber: "HFH-2023-112",
          },
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-NUT-004",
            palletNumber: "PAL-A5",
            boxNumber: "BOX-A013",
            unitPrice: 3.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-113",
            hfhShippingNumber: "HFH-2023-113",
          },
        ],
      },
    },
  });

  // Create requests for archived items
  await db.generalItemRequest.createMany({
    data: [
      {
        generalItemId: archivedItem1.id,
        partnerId: internalPartner.id,
        quantity: 100,
        finalQuantity: 100,
        priority: RequestPriority.HIGH,
      },
      {
        generalItemId: archivedItem2.id,
        partnerId: internalPartner.id,
        quantity: 100,
        finalQuantity: 100,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem1.id,
        partnerId: externalPartner.id,
        quantity: 100,
        finalQuantity: 100,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem3.id,
        partnerId: externalPartner.id,
        quantity: 75,
        finalQuantity: 75,
        priority: RequestPriority.HIGH,
      },
    ],
  });

  console.log("✓ Created archived donor offer");

  // Get line items for allocations
  const allLineItems = await db.lineItem.findMany({
    where: {
      generalItem: {
        donorOfferId: archivedOffer.id,
      },
    },
  });

  // Create pending distribution for internal partner
  const pendingDistribution = await db.distribution.create({
    data: {
      partnerId: internalPartner.id,
      pending: true,
    },
  });

  // Allocate 2 items to pending distribution (no sign-off)
  await db.allocation.createMany({
    data: [
      {
        lineItemId: allLineItems[0].id, // First line item
        partnerId: internalPartner.id,
        distributionId: pendingDistribution.id,
      },
      {
        lineItemId: allLineItems[1].id, // Second line item
        partnerId: internalPartner.id,
        distributionId: pendingDistribution.id,
      },
    ],
  });

  console.log("✓ Created pending distribution");

  // Create approved distribution for external partner with sign-off
  const approvedDistribution = await db.distribution.create({
    data: {
      partnerId: externalPartner.id,
      pending: false,
    },
  });

  // Create sign-off for approved distribution
  const signOff = await db.signOff.create({
    data: {
      staffMemberName: distributionLead.name,
      partnerId: externalPartner.id,
      partnerName: externalPartner.name,
      date: addDays(-10),
    },
  });

  // Allocate 2 items to approved distribution with sign-off
  await db.allocation.createMany({
    data: [
      {
        lineItemId: allLineItems[4].id, // Fifth line item
        partnerId: externalPartner.id,
        distributionId: approvedDistribution.id,
        signOffId: signOff.id,
      },
      {
        lineItemId: allLineItems[5].id, // Sixth line item
        partnerId: externalPartner.id,
        distributionId: approvedDistribution.id,
        signOffId: signOff.id,
      },
    ],
  });

  console.log("✓ Created approved distribution with sign-off");

  // Create shipping statuses for the 2 items in approved distribution
  await db.shippingStatus.createMany({
    data: [
      {
        donorShippingNumber: allLineItems[4].donorShippingNumber!,
        hfhShippingNumber: allLineItems[4].hfhShippingNumber!,
        value: ShipmentStatus.ARRIVED_AT_DEPO,
      },
      {
        donorShippingNumber: allLineItems[5].donorShippingNumber!,
        hfhShippingNumber: allLineItems[5].hfhShippingNumber!,
        value: ShipmentStatus.READY_FOR_DISTRIBUTION,
      },
    ],
  });

  console.log("✓ Created shipping statuses");

  // ============================================================================
  // Wishlists
  // ============================================================================

  // Create wishlists for Internal Partner (Hope Medical Center)
  await db.wishlist.createMany({
    data: [
      // 1. Strong correlation (≥0.75) - very similar to "Amoxicillin 500mg Capsules"
      {
        name: "Amoxicillin 500mg antibiotic capsules for infections",
        quantity: 200,
        priority: RequestPriority.HIGH,
        comments: "Needed for treating bacterial infections in our primary care clinic",
        partnerId: internalPartner.id,
      },
      // 2. Medium correlation (0.6-0.75) - related to antibiotic items
      {
        name: "Antibiotic medications for bacterial treatment",
        quantity: 150,
        priority: RequestPriority.MEDIUM,
        comments: "General antibiotic supplies for various infections",
        partnerId: internalPartner.id,
      },
      // 3. Medium correlation (0.6-0.75) - related to ORS/IV fluids
      {
        name: "Oral rehydration and fluid replacement therapy",
        quantity: 300,
        priority: RequestPriority.HIGH,
        comments: "Critical for dehydration cases especially during cholera outbreaks",
        partnerId: internalPartner.id,
      },
      // 4. No correlation - completely unrelated
      {
        name: "Office desks chairs and filing cabinets",
        quantity: 10,
        priority: RequestPriority.LOW,
        comments: "Administrative office furniture for new clinic wing",
        partnerId: internalPartner.id,
      },
      // 5. No correlation - completely unrelated
      {
        name: "Educational textbooks and learning materials",
        quantity: 50,
        priority: RequestPriority.LOW,
        comments: "For community health education programs",
        partnerId: internalPartner.id,
      },
      // 6. No correlation - completely unrelated
      {
        name: "Agricultural farming tools and equipment",
        quantity: 25,
        priority: RequestPriority.LOW,
        comments: "For community agriculture sustainability program",
        partnerId: internalPartner.id,
      },
    ],
  });

  // Create wishlists for External Partner (Les Cayes Community Hospital)
  await db.wishlist.createMany({
    data: [
      // 1. Strong correlation (≥0.75) - very similar to "Azithromycin 250mg Tablets"
      {
        name: "Azithromycin 250mg antibiotic tablets medication",
        quantity: 180,
        priority: RequestPriority.HIGH,
        comments: "Essential for respiratory and bacterial infections",
        partnerId: externalPartner.id,
      },
      // 2. Medium correlation (0.6-0.75) - related to PPE items
      {
        name: "Personal protective equipment surgical gowns masks",
        quantity: 400,
        priority: RequestPriority.HIGH,
        comments: "PPE supplies for surgical ward and isolation units",
        partnerId: externalPartner.id,
      },
      // 3. Medium correlation (0.6-0.75) - related to nutrition/vitamins
      {
        name: "Nutritional supplements vitamins and minerals",
        quantity: 250,
        priority: RequestPriority.MEDIUM,
        comments: "For maternal health and pediatric malnutrition programs",
        partnerId: externalPartner.id,
      },
      // 4. No correlation - completely unrelated
      {
        name: "Construction building materials cement blocks",
        quantity: 500,
        priority: RequestPriority.LOW,
        comments: "For hospital expansion construction project",
        partnerId: externalPartner.id,
      },
      // 5. No correlation - completely unrelated
      {
        name: "Sports recreation equipment balls nets",
        quantity: 30,
        priority: RequestPriority.LOW,
        comments: "For patient rehabilitation and community wellness programs",
        partnerId: externalPartner.id,
      },
      // 6. No correlation - completely unrelated
      {
        name: "Household cleaning supplies detergents soap",
        quantity: 100,
        priority: RequestPriority.LOW,
        comments: "General cleaning and sanitation supplies",
        partnerId: externalPartner.id,
      },
    ],
  });

  console.log("✓ Created 12 wishlists (6 per partner)");

  try {
    const unfinalizedItems = await db.generalItem.findMany({
      where: {
        OR: [
          {
            donorOffer: {
              state: DonorOfferState.UNFINALIZED,
            },
          },
          {
            donorOffer: {
              state: DonorOfferState.ARCHIVED,
            },
            items: {
              some: {
                allocation: null,
              },
            },
          },
        ],
      },
    });

    if (unfinalizedItems.length > 0) {
      await MatchingService.add(
        unfinalizedItems.map((item) => ({
          title: item.title,
          generalItemId: item.id,
          donorOfferId: item.donorOfferId,
        }))
      );
      console.log(
        `✓ Created ${unfinalizedItems.length} embeddings for general items only`
      );
    }
  } catch (error) {
    console.warn(
      "⚠️  Could not create embeddings (Azure OpenAI may not be configured):",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

buildSeedData()
  .then(() => {
    console.info("\n✅ Database seeded successfully!");
    exit(0);
  })
  .catch((error) => {
    console.error("❌ Error seeding database", error);
    exit(1);
  });

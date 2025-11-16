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
import FileService from "@/services/fileService";
import UserService from "@/services/userService";

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
    : await StreamIoService.createUser(user, UserService.isStaff(user));

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

  // Clear all Stream Chat channels before seeding
  await StreamIoService.deleteAllChannels();
  // Get all signoffs with signature URLs before deleting
  const signOffs = await db.signOff.findMany({
    select: {
      signatureUrl: true,
    },
  });

  // Delete signatures from Azure Storage
  for (const signOff of signOffs) {
    if (signOff.signatureUrl) {
      try {
        await FileService.deleteSignature(signOff.signatureUrl);
      } catch (error) {
        console.warn(
          `Failed to delete signature: ${signOff.signatureUrl}`,
          error
        );
      }
    }
  }

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

  const pendingPartner = await createUser({
    email: "pending@test.com",
    name: "Pending Medical Center",
    passwordHash,
    type: UserType.PARTNER,
    tag: "pending",
    enabled: false,
    pending: true,
    partnerDetails: buildPartnerDetails(
      "Pending Medical Center",
      "Nord",
      "pending",
      19.6,
      -72.3
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

  // General Item 1 with line items - grouped into shipments
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
            donorShippingNumber: "DN-2024-SHIP-001",
            hfhShippingNumber: "HFH-2024-SHIP-001",
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
            donorShippingNumber: "DN-2024-SHIP-001",
            hfhShippingNumber: "HFH-2024-SHIP-001",
          },
        ],
      },
    },
  });

  // General Item 2 - grouped into same shipment as Item 1
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
            donorShippingNumber: "DN-2024-SHIP-001",
            hfhShippingNumber: "HFH-2024-SHIP-001",
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
            donorShippingNumber: "DN-2024-SHIP-001",
            hfhShippingNumber: "HFH-2024-SHIP-001",
          },
        ],
      },
    },
  });

  // General Item 3 - create a second shipment with multiple items
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
            donorShippingNumber: "DN-2024-SHIP-002",
            hfhShippingNumber: "HFH-2024-SHIP-002",
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
            donorShippingNumber: "DN-2024-SHIP-002",
            hfhShippingNumber: "HFH-2024-SHIP-002",
          },
        ],
      },
    },
  });

  // General Item 4 - grouped into same shipment as Item 3
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
            donorShippingNumber: "DN-2024-SHIP-002",
            hfhShippingNumber: "HFH-2024-SHIP-002",
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
            donorShippingNumber: "DN-2024-SHIP-002",
            hfhShippingNumber: "HFH-2024-SHIP-002",
          },
        ],
      },
    },
  });

  // General Item 5 - create a third shipment
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
            donorShippingNumber: "DN-2024-SHIP-003",
            hfhShippingNumber: "HFH-2024-SHIP-003",
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
            donorShippingNumber: "DN-2024-SHIP-003",
            hfhShippingNumber: "HFH-2024-SHIP-003",
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

  // Create 5 general items for archived offer - grouped into shipments
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
            donorShippingNumber: "DN-2023-101",
            hfhShippingNumber: "HFH-2023-101",
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
            donorShippingNumber: "DN-2023-101",
            hfhShippingNumber: "HFH-2023-101",
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
            donorShippingNumber: "DN-2023-104",
            hfhShippingNumber: "HFH-2023-104",
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
            donorShippingNumber: "DN-2023-106",
            hfhShippingNumber: "HFH-2023-106",
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
            donorShippingNumber: "DN-2023-108",
            hfhShippingNumber: "HFH-2023-108",
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

  const archivedItem6 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Paracetamol 500mg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-09-30"),
      initialQuantity: 250,
      requestQuantity: 250,
      weight: 8,
      type: ItemType.MEDICATION,
      category: ItemCategory.PAIN_RELIEVERS,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 125,
            lotNumber: "LOT-PAR-001",
            palletNumber: "PAL-A6",
            boxNumber: "BOX-A014",
            unitPrice: 4.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-114",
            hfhShippingNumber: "HFH-2023-114",
          },
          {
            donorName: "Med Relief International",
            quantity: 125,
            lotNumber: "LOT-PAR-002",
            palletNumber: "PAL-A6",
            boxNumber: "BOX-A015",
            unitPrice: 4.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-114",
            hfhShippingNumber: "HFH-2023-114",
          },
        ],
      },
    },
  });

  const archivedItem7 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Bandages Assorted Sizes",
      unitType: "Box",
      expirationDate: new Date("2027-06-30"),
      initialQuantity: 180,
      requestQuantity: 180,
      weight: 6,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.WOUND_CARE,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 60,
            lotNumber: "LOT-BAN-001",
            palletNumber: "PAL-A7",
            boxNumber: "BOX-A016",
            unitPrice: 2.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-115",
            hfhShippingNumber: "HFH-2023-115",
          },
          {
            donorName: "Med Relief International",
            quantity: 60,
            lotNumber: "LOT-BAN-002",
            palletNumber: "PAL-A7",
            boxNumber: "BOX-A017",
            unitPrice: 2.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-115",
            hfhShippingNumber: "HFH-2023-115",
          },
          {
            donorName: "Med Relief International",
            quantity: 60,
            lotNumber: "LOT-BAN-003",
            palletNumber: "PAL-A7",
            boxNumber: "BOX-A018",
            unitPrice: 2.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-115",
            hfhShippingNumber: "HFH-2023-115",
          },
        ],
      },
    },
  });

  const archivedItem8 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Hand Sanitizer 500ml",
      unitType: "Bottle",
      expirationDate: new Date("2026-03-31"),
      initialQuantity: 320,
      requestQuantity: 320,
      weight: 12,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.HYGIENE,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 80,
            lotNumber: "LOT-SAN-001",
            palletNumber: "PAL-A8",
            boxNumber: "BOX-A019",
            unitPrice: 6.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-116",
            hfhShippingNumber: "HFH-2023-116",
          },
          {
            donorName: "Med Relief International",
            quantity: 80,
            lotNumber: "LOT-SAN-002",
            palletNumber: "PAL-A8",
            boxNumber: "BOX-A020",
            unitPrice: 6.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-116",
            hfhShippingNumber: "HFH-2023-116",
          },
          {
            donorName: "Med Relief International",
            quantity: 80,
            lotNumber: "LOT-SAN-003",
            palletNumber: "PAL-A8",
            boxNumber: "BOX-A021",
            unitPrice: 6.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-116",
            hfhShippingNumber: "HFH-2023-116",
          },
          {
            donorName: "Med Relief International",
            quantity: 80,
            lotNumber: "LOT-SAN-004",
            palletNumber: "PAL-A8",
            boxNumber: "BOX-A022",
            unitPrice: 6.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-116",
            hfhShippingNumber: "HFH-2023-116",
          },
        ],
      },
    },
  });

  // Additional unallocated items for pagination testing (need 21+ items for 2 pages with pageSize=20)
  const archivedItem9 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Metformin 500mg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-05-31"),
      initialQuantity: 200,
      requestQuantity: 200,
      weight: 9,
      type: ItemType.MEDICATION,
      category: ItemCategory.DIABETES,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-MET-001",
            palletNumber: "PAL-A9",
            boxNumber: "BOX-A023",
            unitPrice: 7.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-117",
            hfhShippingNumber: "HFH-2023-117",
          },
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-MET-002",
            palletNumber: "PAL-A9",
            boxNumber: "BOX-A024",
            unitPrice: 7.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-117",
            hfhShippingNumber: "HFH-2023-117",
          },
        ],
      },
    },
  });

  const archivedItem10 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Insulin Syringes 1ml",
      unitType: "Box",
      expirationDate: new Date("2027-08-31"),
      initialQuantity: 150,
      requestQuantity: 150,
      weight: 4,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.NEEDLES_SYRINGES,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 50,
            lotNumber: "LOT-INS-001",
            palletNumber: "PAL-A10",
            boxNumber: "BOX-A025",
            unitPrice: 5.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-118",
            hfhShippingNumber: "HFH-2023-118",
          },
          {
            donorName: "Med Relief International",
            quantity: 50,
            lotNumber: "LOT-INS-002",
            palletNumber: "PAL-A10",
            boxNumber: "BOX-A026",
            unitPrice: 5.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-118",
            hfhShippingNumber: "HFH-2023-118",
          },
          {
            donorName: "Med Relief International",
            quantity: 50,
            lotNumber: "LOT-INS-003",
            palletNumber: "PAL-A10",
            boxNumber: "BOX-A027",
            unitPrice: 5.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-118",
            hfhShippingNumber: "HFH-2023-118",
          },
        ],
      },
    },
  });

  const archivedItem11 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Ceftriaxone 1g Vials",
      unitType: "Vial",
      expirationDate: new Date("2026-07-31"),
      initialQuantity: 120,
      requestQuantity: 120,
      weight: 11,
      type: ItemType.MEDICATION,
      category: ItemCategory.ANTIBIOTIC,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 40,
            lotNumber: "LOT-CEF-001",
            palletNumber: "PAL-A11",
            boxNumber: "BOX-A028",
            unitPrice: 18.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-119",
            hfhShippingNumber: "HFH-2023-119",
          },
          {
            donorName: "Med Relief International",
            quantity: 40,
            lotNumber: "LOT-CEF-002",
            palletNumber: "PAL-A11",
            boxNumber: "BOX-A029",
            unitPrice: 18.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-119",
            hfhShippingNumber: "HFH-2023-119",
          },
          {
            donorName: "Med Relief International",
            quantity: 40,
            lotNumber: "LOT-CEF-003",
            palletNumber: "PAL-A11",
            boxNumber: "BOX-A030",
            unitPrice: 18.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-119",
            hfhShippingNumber: "HFH-2023-119",
          },
        ],
      },
    },
  });

  const archivedItem12 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Stethoscopes",
      unitType: "Unit",
      expirationDate: new Date("2028-12-31"),
      initialQuantity: 60,
      requestQuantity: 60,
      weight: 3,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.GENERAL,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 20,
            lotNumber: "LOT-STE-001",
            palletNumber: "PAL-A12",
            boxNumber: "BOX-A031",
            unitPrice: 35.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-120",
            hfhShippingNumber: "HFH-2023-120",
          },
          {
            donorName: "Med Relief International",
            quantity: 20,
            lotNumber: "LOT-STE-002",
            palletNumber: "PAL-A12",
            boxNumber: "BOX-A032",
            unitPrice: 35.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-120",
            hfhShippingNumber: "HFH-2023-120",
          },
          {
            donorName: "Med Relief International",
            quantity: 20,
            lotNumber: "LOT-STE-003",
            palletNumber: "PAL-A12",
            boxNumber: "BOX-A033",
            unitPrice: 35.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-120",
            hfhShippingNumber: "HFH-2023-120",
          },
        ],
      },
    },
  });

  const archivedItem13 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Folic Acid 5mg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-04-30"),
      initialQuantity: 280,
      requestQuantity: 280,
      weight: 7,
      type: ItemType.MEDICATION_SUPPLEMENT,
      category: ItemCategory.OB_GYN,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 70,
            lotNumber: "LOT-FOL-001",
            palletNumber: "PAL-A13",
            boxNumber: "BOX-A034",
            unitPrice: 3.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-121",
            hfhShippingNumber: "HFH-2023-121",
          },
          {
            donorName: "Med Relief International",
            quantity: 70,
            lotNumber: "LOT-FOL-002",
            palletNumber: "PAL-A13",
            boxNumber: "BOX-A035",
            unitPrice: 3.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-121",
            hfhShippingNumber: "HFH-2023-121",
          },
          {
            donorName: "Med Relief International",
            quantity: 70,
            lotNumber: "LOT-FOL-003",
            palletNumber: "PAL-A13",
            boxNumber: "BOX-A036",
            unitPrice: 3.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-121",
            hfhShippingNumber: "HFH-2023-121",
          },
          {
            donorName: "Med Relief International",
            quantity: 70,
            lotNumber: "LOT-FOL-004",
            palletNumber: "PAL-A13",
            boxNumber: "BOX-A037",
            unitPrice: 3.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-121",
            hfhShippingNumber: "HFH-2023-121",
          },
        ],
      },
    },
  });

  const archivedItem14 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Cotton Swabs Sterile",
      unitType: "Box",
      expirationDate: new Date("2027-02-28"),
      initialQuantity: 240,
      requestQuantity: 240,
      weight: 5,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.WOUND_CARE,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 80,
            lotNumber: "LOT-COT-001",
            palletNumber: "PAL-A14",
            boxNumber: "BOX-A038",
            unitPrice: 2.0,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-122",
            hfhShippingNumber: "HFH-2023-122",
          },
          {
            donorName: "Med Relief International",
            quantity: 80,
            lotNumber: "LOT-COT-002",
            palletNumber: "PAL-A14",
            boxNumber: "BOX-A039",
            unitPrice: 2.0,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-122",
            hfhShippingNumber: "HFH-2023-122",
          },
          {
            donorName: "Med Relief International",
            quantity: 80,
            lotNumber: "LOT-COT-003",
            palletNumber: "PAL-A14",
            boxNumber: "BOX-A040",
            unitPrice: 2.0,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-122",
            hfhShippingNumber: "HFH-2023-122",
          },
        ],
      },
    },
  });

  const archivedItem15 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Amlodipine 5mg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-10-31"),
      initialQuantity: 180,
      requestQuantity: 180,
      weight: 8,
      type: ItemType.MEDICATION,
      category: ItemCategory.CARDIOVASCULAR,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 90,
            lotNumber: "LOT-AML-001",
            palletNumber: "PAL-A15",
            boxNumber: "BOX-A041",
            unitPrice: 6.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-123",
            hfhShippingNumber: "HFH-2023-123",
          },
          {
            donorName: "Med Relief International",
            quantity: 90,
            lotNumber: "LOT-AML-002",
            palletNumber: "PAL-A15",
            boxNumber: "BOX-A042",
            unitPrice: 6.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-123",
            hfhShippingNumber: "HFH-2023-123",
          },
        ],
      },
    },
  });

  const archivedItem16 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Face Masks Surgical",
      unitType: "Box",
      expirationDate: new Date("2027-01-31"),
      initialQuantity: 500,
      requestQuantity: 500,
      weight: 6,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.PPE,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 125,
            lotNumber: "LOT-MAS-001",
            palletNumber: "PAL-A16",
            boxNumber: "BOX-A043",
            unitPrice: 4.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-124",
            hfhShippingNumber: "HFH-2023-124",
          },
          {
            donorName: "Med Relief International",
            quantity: 125,
            lotNumber: "LOT-MAS-002",
            palletNumber: "PAL-A16",
            boxNumber: "BOX-A044",
            unitPrice: 4.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-124",
            hfhShippingNumber: "HFH-2023-124",
          },
          {
            donorName: "Med Relief International",
            quantity: 125,
            lotNumber: "LOT-MAS-003",
            palletNumber: "PAL-A16",
            boxNumber: "BOX-A045",
            unitPrice: 4.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-124",
            hfhShippingNumber: "HFH-2023-124",
          },
          {
            donorName: "Med Relief International",
            quantity: 125,
            lotNumber: "LOT-MAS-004",
            palletNumber: "PAL-A16",
            boxNumber: "BOX-A046",
            unitPrice: 4.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-124",
            hfhShippingNumber: "HFH-2023-124",
          },
        ],
      },
    },
  });

  const archivedItem17 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Hydrochlorothiazide 25mg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-08-31"),
      initialQuantity: 220,
      requestQuantity: 220,
      weight: 9,
      type: ItemType.MEDICATION,
      category: ItemCategory.CARDIOVASCULAR,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 110,
            lotNumber: "LOT-HYD-001",
            palletNumber: "PAL-A17",
            boxNumber: "BOX-A047",
            unitPrice: 5.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-125",
            hfhShippingNumber: "HFH-2023-125",
          },
          {
            donorName: "Med Relief International",
            quantity: 110,
            lotNumber: "LOT-HYD-002",
            palletNumber: "PAL-A17",
            boxNumber: "BOX-A048",
            unitPrice: 5.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-125",
            hfhShippingNumber: "HFH-2023-125",
          },
        ],
      },
    },
  });

  const archivedItem18 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Alcohol Wipes",
      unitType: "Box",
      expirationDate: new Date("2026-11-30"),
      initialQuantity: 300,
      requestQuantity: 300,
      weight: 7,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.HYGIENE,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-ALC-001",
            palletNumber: "PAL-A18",
            boxNumber: "BOX-A049",
            unitPrice: 3.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-126",
            hfhShippingNumber: "HFH-2023-126",
          },
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-ALC-002",
            palletNumber: "PAL-A18",
            boxNumber: "BOX-A050",
            unitPrice: 3.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-126",
            hfhShippingNumber: "HFH-2023-126",
          },
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-ALC-003",
            palletNumber: "PAL-A18",
            boxNumber: "BOX-A051",
            unitPrice: 3.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-126",
            hfhShippingNumber: "HFH-2023-126",
          },
        ],
      },
    },
  });

  const archivedItem19 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Lisinopril 10mg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-09-30"),
      initialQuantity: 190,
      requestQuantity: 190,
      weight: 8,
      type: ItemType.MEDICATION,
      category: ItemCategory.CARDIOVASCULAR,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 95,
            lotNumber: "LOT-LIS-001",
            palletNumber: "PAL-A19",
            boxNumber: "BOX-A052",
            unitPrice: 7.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-127",
            hfhShippingNumber: "HFH-2023-127",
          },
          {
            donorName: "Med Relief International",
            quantity: 95,
            lotNumber: "LOT-LIS-002",
            palletNumber: "PAL-A19",
            boxNumber: "BOX-A053",
            unitPrice: 7.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-127",
            hfhShippingNumber: "HFH-2023-127",
          },
        ],
      },
    },
  });

  const archivedItem20 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Medical Tape",
      unitType: "Roll",
      expirationDate: new Date("2027-05-31"),
      initialQuantity: 160,
      requestQuantity: 160,
      weight: 4,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.WOUND_CARE,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 40,
            lotNumber: "LOT-TAP-001",
            palletNumber: "PAL-A20",
            boxNumber: "BOX-A054",
            unitPrice: 2.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-128",
            hfhShippingNumber: "HFH-2023-128",
          },
          {
            donorName: "Med Relief International",
            quantity: 40,
            lotNumber: "LOT-TAP-002",
            palletNumber: "PAL-A20",
            boxNumber: "BOX-A055",
            unitPrice: 2.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-128",
            hfhShippingNumber: "HFH-2023-128",
          },
          {
            donorName: "Med Relief International",
            quantity: 40,
            lotNumber: "LOT-TAP-003",
            palletNumber: "PAL-A20",
            boxNumber: "BOX-A056",
            unitPrice: 2.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-128",
            hfhShippingNumber: "HFH-2023-128",
          },
          {
            donorName: "Med Relief International",
            quantity: 40,
            lotNumber: "LOT-TAP-004",
            palletNumber: "PAL-A20",
            boxNumber: "BOX-A057",
            unitPrice: 2.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-128",
            hfhShippingNumber: "HFH-2023-128",
          },
        ],
      },
    },
  });

  const archivedItem21 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Omeprazole 20mg Capsules",
      unitType: "Bottle",
      expirationDate: new Date("2026-06-30"),
      initialQuantity: 210,
      requestQuantity: 210,
      weight: 8,
      type: ItemType.MEDICATION,
      category: ItemCategory.GASTROENTEROLOGY,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 70,
            lotNumber: "LOT-OME-001",
            palletNumber: "PAL-A21",
            boxNumber: "BOX-A058",
            unitPrice: 6.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-129",
            hfhShippingNumber: "HFH-2023-129",
          },
          {
            donorName: "Med Relief International",
            quantity: 70,
            lotNumber: "LOT-OME-002",
            palletNumber: "PAL-A21",
            boxNumber: "BOX-A059",
            unitPrice: 6.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-129",
            hfhShippingNumber: "HFH-2023-129",
          },
          {
            donorName: "Med Relief International",
            quantity: 70,
            lotNumber: "LOT-OME-003",
            palletNumber: "PAL-A21",
            boxNumber: "BOX-A060",
            unitPrice: 6.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-129",
            hfhShippingNumber: "HFH-2023-129",
          },
        ],
      },
    },
  });

  const archivedItem22 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Salbutamol Inhaler",
      unitType: "Unit",
      expirationDate: new Date("2026-12-31"),
      initialQuantity: 90,
      requestQuantity: 90,
      weight: 5,
      type: ItemType.MEDICATION,
      category: ItemCategory.RESPIRATORY,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 30,
            lotNumber: "LOT-SAL-001",
            palletNumber: "PAL-A22",
            boxNumber: "BOX-A061",
            unitPrice: 12.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-130",
            hfhShippingNumber: "HFH-2023-130",
          },
          {
            donorName: "Med Relief International",
            quantity: 30,
            lotNumber: "LOT-SAL-002",
            palletNumber: "PAL-A22",
            boxNumber: "BOX-A062",
            unitPrice: 12.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-130",
            hfhShippingNumber: "HFH-2023-130",
          },
          {
            donorName: "Med Relief International",
            quantity: 30,
            lotNumber: "LOT-SAL-003",
            palletNumber: "PAL-A22",
            boxNumber: "BOX-A063",
            unitPrice: 12.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-130",
            hfhShippingNumber: "HFH-2023-130",
          },
        ],
      },
    },
  });

  const archivedItem23 = await db.generalItem.create({
    data: {
      donorOfferId: unfinalizedOffer.id,
      title: "Glucose Test Strips",
      unitType: "Box",
      expirationDate: new Date("2026-03-31"),
      initialQuantity: 140,
      requestQuantity: 140,
      weight: 3,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.DIABETES,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 70,
            lotNumber: "LOT-GLU-001",
            palletNumber: "PAL-A23",
            boxNumber: "BOX-A064",
            unitPrice: 8.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-131",
            hfhShippingNumber: "HFH-2023-131",
          },
          {
            donorName: "Med Relief International",
            quantity: 70,
            lotNumber: "LOT-GLU-002",
            palletNumber: "PAL-A23",
            boxNumber: "BOX-A065",
            unitPrice: 8.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-131",
            hfhShippingNumber: "HFH-2023-131",
          },
        ],
      },
    },
  });

  // Additional unallocated items for pagination (items 24-45)
  const archivedItem24 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Atorvastatin 20mg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-11-30"),
      initialQuantity: 170,
      requestQuantity: 170,
      weight: 8,
      type: ItemType.MEDICATION,
      category: ItemCategory.CARDIOVASCULAR,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 85,
            lotNumber: "LOT-ATO-001",
            palletNumber: "PAL-A24",
            boxNumber: "BOX-A066",
            unitPrice: 9.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-132",
            hfhShippingNumber: "HFH-2023-132",
          },
          {
            donorName: "Med Relief International",
            quantity: 85,
            lotNumber: "LOT-ATO-002",
            palletNumber: "PAL-A24",
            boxNumber: "BOX-A067",
            unitPrice: 9.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-132",
            hfhShippingNumber: "HFH-2023-132",
          },
        ],
      },
    },
  });

  const archivedItem25 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Diazepam 5mg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-07-31"),
      initialQuantity: 130,
      requestQuantity: 130,
      weight: 7,
      type: ItemType.MEDICATION,
      category: ItemCategory.PAIN_RELIEVERS,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 65,
            lotNumber: "LOT-DIA-001",
            palletNumber: "PAL-A25",
            boxNumber: "BOX-A068",
            unitPrice: 11.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-133",
            hfhShippingNumber: "HFH-2023-133",
          },
          {
            donorName: "Med Relief International",
            quantity: 65,
            lotNumber: "LOT-DIA-002",
            palletNumber: "PAL-A25",
            boxNumber: "BOX-A069",
            unitPrice: 11.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-133",
            hfhShippingNumber: "HFH-2023-133",
          },
        ],
      },
    },
  });

  const archivedItem26 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Oxygen Concentrator Filters",
      unitType: "Box",
      expirationDate: new Date("2027-09-30"),
      initialQuantity: 100,
      requestQuantity: 100,
      weight: 4,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.RESPIRATORY,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 50,
            lotNumber: "LOT-OXY-001",
            palletNumber: "PAL-A26",
            boxNumber: "BOX-A070",
            unitPrice: 14.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-134",
            hfhShippingNumber: "HFH-2023-134",
          },
          {
            donorName: "Med Relief International",
            quantity: 50,
            lotNumber: "LOT-OXY-002",
            palletNumber: "PAL-A26",
            boxNumber: "BOX-A071",
            unitPrice: 14.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-134",
            hfhShippingNumber: "HFH-2023-134",
          },
        ],
      },
    },
  });

  const archivedItem27 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Chlorhexidine Antiseptic Solution",
      unitType: "Bottle",
      expirationDate: new Date("2026-05-31"),
      initialQuantity: 260,
      requestQuantity: 260,
      weight: 10,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.HYGIENE,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 130,
            lotNumber: "LOT-CHL-001",
            palletNumber: "PAL-A27",
            boxNumber: "BOX-A072",
            unitPrice: 7.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-135",
            hfhShippingNumber: "HFH-2023-135",
          },
          {
            donorName: "Med Relief International",
            quantity: 130,
            lotNumber: "LOT-CHL-002",
            palletNumber: "PAL-A27",
            boxNumber: "BOX-A073",
            unitPrice: 7.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-135",
            hfhShippingNumber: "HFH-2023-135",
          },
        ],
      },
    },
  });

  const archivedItem28 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Doxycycline 100mg Capsules",
      unitType: "Bottle",
      expirationDate: new Date("2026-10-31"),
      initialQuantity: 240,
      requestQuantity: 240,
      weight: 9,
      type: ItemType.MEDICATION,
      category: ItemCategory.ANTIBIOTIC,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 80,
            lotNumber: "LOT-DOX-001",
            palletNumber: "PAL-A28",
            boxNumber: "BOX-A074",
            unitPrice: 8.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-136",
            hfhShippingNumber: "HFH-2023-136",
          },
          {
            donorName: "Med Relief International",
            quantity: 80,
            lotNumber: "LOT-DOX-002",
            palletNumber: "PAL-A28",
            boxNumber: "BOX-A075",
            unitPrice: 8.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-136",
            hfhShippingNumber: "HFH-2023-136",
          },
          {
            donorName: "Med Relief International",
            quantity: 80,
            lotNumber: "LOT-DOX-003",
            palletNumber: "PAL-A28",
            boxNumber: "BOX-A076",
            unitPrice: 8.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-136",
            hfhShippingNumber: "HFH-2023-136",
          },
        ],
      },
    },
  });

  const archivedItem29 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Surgical Scissors",
      unitType: "Unit",
      expirationDate: new Date("2028-04-30"),
      initialQuantity: 70,
      requestQuantity: 70,
      weight: 2,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.GENERAL,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 35,
            lotNumber: "LOT-SCI-001",
            palletNumber: "PAL-A29",
            boxNumber: "BOX-A077",
            unitPrice: 22.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-137",
            hfhShippingNumber: "HFH-2023-137",
          },
          {
            donorName: "Med Relief International",
            quantity: 35,
            lotNumber: "LOT-SCI-002",
            palletNumber: "PAL-A29",
            boxNumber: "BOX-A078",
            unitPrice: 22.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-137",
            hfhShippingNumber: "HFH-2023-137",
          },
        ],
      },
    },
  });

  const archivedItem30 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Iron Supplements 65mg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-08-31"),
      initialQuantity: 290,
      requestQuantity: 290,
      weight: 8,
      type: ItemType.MEDICATION_SUPPLEMENT,
      category: ItemCategory.NUTRITION_SUPPLEMENTS,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 145,
            lotNumber: "LOT-IRO-001",
            palletNumber: "PAL-A30",
            boxNumber: "BOX-A079",
            unitPrice: 4.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-138",
            hfhShippingNumber: "HFH-2023-138",
          },
          {
            donorName: "Med Relief International",
            quantity: 145,
            lotNumber: "LOT-IRO-002",
            palletNumber: "PAL-A30",
            boxNumber: "BOX-A080",
            unitPrice: 4.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-138",
            hfhShippingNumber: "HFH-2023-138",
          },
        ],
      },
    },
  });

  const archivedItem31 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Nebulizer Masks",
      unitType: "Box",
      expirationDate: new Date("2027-07-31"),
      initialQuantity: 110,
      requestQuantity: 110,
      weight: 5,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.RESPIRATORY,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 55,
            lotNumber: "LOT-NEB-001",
            palletNumber: "PAL-A31",
            boxNumber: "BOX-A081",
            unitPrice: 13.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-139",
            hfhShippingNumber: "HFH-2023-139",
          },
          {
            donorName: "Med Relief International",
            quantity: 55,
            lotNumber: "LOT-NEB-002",
            palletNumber: "PAL-A31",
            boxNumber: "BOX-A082",
            unitPrice: 13.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-139",
            hfhShippingNumber: "HFH-2023-139",
          },
        ],
      },
    },
  });

  const archivedItem32 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Warfarin 5mg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-12-31"),
      initialQuantity: 200,
      requestQuantity: 200,
      weight: 7,
      type: ItemType.MEDICATION,
      category: ItemCategory.CARDIOVASCULAR,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-WAR-001",
            palletNumber: "PAL-A32",
            boxNumber: "BOX-A083",
            unitPrice: 10.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-140",
            hfhShippingNumber: "HFH-2023-140",
          },
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-WAR-002",
            palletNumber: "PAL-A32",
            boxNumber: "BOX-A084",
            unitPrice: 10.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-140",
            hfhShippingNumber: "HFH-2023-140",
          },
        ],
      },
    },
  });

  const archivedItem33 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Disposable Bedpans",
      unitType: "Unit",
      expirationDate: new Date("2027-11-30"),
      initialQuantity: 80,
      requestQuantity: 80,
      weight: 6,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.GENERAL,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 40,
            lotNumber: "LOT-BED-001",
            palletNumber: "PAL-A33",
            boxNumber: "BOX-A085",
            unitPrice: 5.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-141",
            hfhShippingNumber: "HFH-2023-141",
          },
          {
            donorName: "Med Relief International",
            quantity: 40,
            lotNumber: "LOT-BED-002",
            palletNumber: "PAL-A33",
            boxNumber: "BOX-A086",
            unitPrice: 5.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-141",
            hfhShippingNumber: "HFH-2023-141",
          },
        ],
      },
    },
  });

  const archivedItem34 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Ciprofloxacin 500mg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-09-30"),
      initialQuantity: 220,
      requestQuantity: 220,
      weight: 9,
      type: ItemType.MEDICATION,
      category: ItemCategory.ANTIBIOTIC,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 110,
            lotNumber: "LOT-CIP-001",
            palletNumber: "PAL-A34",
            boxNumber: "BOX-A087",
            unitPrice: 9.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-142",
            hfhShippingNumber: "HFH-2023-142",
          },
          {
            donorName: "Med Relief International",
            quantity: 110,
            lotNumber: "LOT-CIP-002",
            palletNumber: "PAL-A34",
            boxNumber: "BOX-A088",
            unitPrice: 9.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-142",
            hfhShippingNumber: "HFH-2023-142",
          },
        ],
      },
    },
  });

  const archivedItem35 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Urine Collection Bags",
      unitType: "Box",
      expirationDate: new Date("2027-06-30"),
      initialQuantity: 150,
      requestQuantity: 150,
      weight: 4,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.GENERAL,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 75,
            lotNumber: "LOT-URI-001",
            palletNumber: "PAL-A35",
            boxNumber: "BOX-A089",
            unitPrice: 6.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-143",
            hfhShippingNumber: "HFH-2023-143",
          },
          {
            donorName: "Med Relief International",
            quantity: 75,
            lotNumber: "LOT-URI-002",
            palletNumber: "PAL-A35",
            boxNumber: "BOX-A090",
            unitPrice: 6.5,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-143",
            hfhShippingNumber: "HFH-2023-143",
          },
        ],
      },
    },
  });

  const archivedItem36 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Metronidazole 500mg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-06-30"),
      initialQuantity: 190,
      requestQuantity: 190,
      weight: 8,
      type: ItemType.MEDICATION,
      category: ItemCategory.ANTIBIOTIC,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 95,
            lotNumber: "LOT-MET-001",
            palletNumber: "PAL-A36",
            boxNumber: "BOX-A091",
            unitPrice: 7.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-144",
            hfhShippingNumber: "HFH-2023-144",
          },
          {
            donorName: "Med Relief International",
            quantity: 95,
            lotNumber: "LOT-MET-002",
            palletNumber: "PAL-A36",
            boxNumber: "BOX-A092",
            unitPrice: 7.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-144",
            hfhShippingNumber: "HFH-2023-144",
          },
        ],
      },
    },
  });

  const archivedItem37 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Blood Collection Tubes",
      unitType: "Box",
      expirationDate: new Date("2027-01-31"),
      initialQuantity: 270,
      requestQuantity: 270,
      weight: 5,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.GENERAL,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 90,
            lotNumber: "LOT-BCT-001",
            palletNumber: "PAL-A37",
            boxNumber: "BOX-A093",
            unitPrice: 4.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-145",
            hfhShippingNumber: "HFH-2023-145",
          },
          {
            donorName: "Med Relief International",
            quantity: 90,
            lotNumber: "LOT-BCT-002",
            palletNumber: "PAL-A37",
            boxNumber: "BOX-A094",
            unitPrice: 4.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-145",
            hfhShippingNumber: "HFH-2023-145",
          },
          {
            donorName: "Med Relief International",
            quantity: 90,
            lotNumber: "LOT-BCT-003",
            palletNumber: "PAL-A37",
            boxNumber: "BOX-A095",
            unitPrice: 4.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-145",
            hfhShippingNumber: "HFH-2023-145",
          },
        ],
      },
    },
  });

  const archivedItem38 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Levothyroxine 50mcg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-04-30"),
      initialQuantity: 160,
      requestQuantity: 160,
      weight: 7,
      type: ItemType.MEDICATION,
      category: ItemCategory.GENERAL,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 80,
            lotNumber: "LOT-LEV-001",
            palletNumber: "PAL-A38",
            boxNumber: "BOX-A096",
            unitPrice: 8.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-146",
            hfhShippingNumber: "HFH-2023-146",
          },
          {
            donorName: "Med Relief International",
            quantity: 80,
            lotNumber: "LOT-LEV-002",
            palletNumber: "PAL-A38",
            boxNumber: "BOX-A097",
            unitPrice: 8.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-146",
            hfhShippingNumber: "HFH-2023-146",
          },
        ],
      },
    },
  });

  const archivedItem39 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Surgical Forceps",
      unitType: "Unit",
      expirationDate: new Date("2028-05-31"),
      initialQuantity: 90,
      requestQuantity: 90,
      weight: 3,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.GENERAL,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 45,
            lotNumber: "LOT-FOR-001",
            palletNumber: "PAL-A39",
            boxNumber: "BOX-A098",
            unitPrice: 28.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-147",
            hfhShippingNumber: "HFH-2023-147",
          },
          {
            donorName: "Med Relief International",
            quantity: 45,
            lotNumber: "LOT-FOR-002",
            palletNumber: "PAL-A39",
            boxNumber: "BOX-A099",
            unitPrice: 28.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-147",
            hfhShippingNumber: "HFH-2023-147",
          },
        ],
      },
    },
  });

  const archivedItem40 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Calcium Carbonate 500mg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-10-31"),
      initialQuantity: 310,
      requestQuantity: 310,
      weight: 9,
      type: ItemType.MEDICATION_SUPPLEMENT,
      category: ItemCategory.NUTRITION_SUPPLEMENTS,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 155,
            lotNumber: "LOT-CAL-001",
            palletNumber: "PAL-A40",
            boxNumber: "BOX-A100",
            unitPrice: 3.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-148",
            hfhShippingNumber: "HFH-2023-148",
          },
          {
            donorName: "Med Relief International",
            quantity: 155,
            lotNumber: "LOT-CAL-002",
            palletNumber: "PAL-A40",
            boxNumber: "BOX-A101",
            unitPrice: 3.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-148",
            hfhShippingNumber: "HFH-2023-148",
          },
        ],
      },
    },
  });

  const archivedItem41 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Disposable Catheters",
      unitType: "Box",
      expirationDate: new Date("2027-08-31"),
      initialQuantity: 120,
      requestQuantity: 120,
      weight: 5,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.GENERAL,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 60,
            lotNumber: "LOT-CAT-001",
            palletNumber: "PAL-A41",
            boxNumber: "BOX-A102",
            unitPrice: 12.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-149",
            hfhShippingNumber: "HFH-2023-149",
          },
          {
            donorName: "Med Relief International",
            quantity: 60,
            lotNumber: "LOT-CAT-002",
            palletNumber: "PAL-A41",
            boxNumber: "BOX-A103",
            unitPrice: 12.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-149",
            hfhShippingNumber: "HFH-2023-149",
          },
        ],
      },
    },
  });

  const archivedItem42 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Furosemide 40mg Tablets",
      unitType: "Bottle",
      expirationDate: new Date("2026-11-30"),
      initialQuantity: 230,
      requestQuantity: 230,
      weight: 8,
      type: ItemType.MEDICATION,
      category: ItemCategory.CARDIOVASCULAR,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 115,
            lotNumber: "LOT-FUR-001",
            palletNumber: "PAL-A42",
            boxNumber: "BOX-A104",
            unitPrice: 5.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-150",
            hfhShippingNumber: "HFH-2023-150",
          },
          {
            donorName: "Med Relief International",
            quantity: 115,
            lotNumber: "LOT-FUR-002",
            palletNumber: "PAL-A42",
            boxNumber: "BOX-A105",
            unitPrice: 5.5,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-150",
            hfhShippingNumber: "HFH-2023-150",
          },
        ],
      },
    },
  });

  const archivedItem43 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Pulse Oximeters",
      unitType: "Unit",
      expirationDate: new Date("2028-02-28"),
      initialQuantity: 50,
      requestQuantity: 50,
      weight: 4,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.CARDIOVASCULAR,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 25,
            lotNumber: "LOT-PUL-001",
            palletNumber: "PAL-A43",
            boxNumber: "BOX-A106",
            unitPrice: 45.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-151",
            hfhShippingNumber: "HFH-2023-151",
          },
          {
            donorName: "Med Relief International",
            quantity: 25,
            lotNumber: "LOT-PUL-002",
            palletNumber: "PAL-A43",
            boxNumber: "BOX-A107",
            unitPrice: 45.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-151",
            hfhShippingNumber: "HFH-2023-151",
          },
        ],
      },
    },
  });

  const archivedItem44 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Vitamin D3 1000IU Capsules",
      unitType: "Bottle",
      expirationDate: new Date("2026-07-31"),
      initialQuantity: 350,
      requestQuantity: 350,
      weight: 8,
      type: ItemType.MEDICATION_SUPPLEMENT,
      category: ItemCategory.NUTRITION_SUPPLEMENTS,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 175,
            lotNumber: "LOT-VIT-001",
            palletNumber: "PAL-A44",
            boxNumber: "BOX-A108",
            unitPrice: 4.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-152",
            hfhShippingNumber: "HFH-2023-152",
          },
          {
            donorName: "Med Relief International",
            quantity: 175,
            lotNumber: "LOT-VIT-002",
            palletNumber: "PAL-A44",
            boxNumber: "BOX-A109",
            unitPrice: 4.0,
            allowAllocations: true,
            visible: true,
            gik: false,
            donorShippingNumber: "DN-2023-152",
            hfhShippingNumber: "HFH-2023-152",
          },
        ],
      },
    },
  });

  const archivedItem45 = await db.generalItem.create({
    data: {
      donorOfferId: archivedOffer.id,
      title: "Disposable Specimen Containers",
      unitType: "Box",
      expirationDate: new Date("2027-10-31"),
      initialQuantity: 200,
      requestQuantity: 200,
      weight: 4,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.GENERAL,
      items: {
        create: [
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-SPC-001",
            palletNumber: "PAL-A45",
            boxNumber: "BOX-A110",
            unitPrice: 3.0,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-153",
            hfhShippingNumber: "HFH-2023-153",
          },
          {
            donorName: "Med Relief International",
            quantity: 100,
            lotNumber: "LOT-SPC-002",
            palletNumber: "PAL-A45",
            boxNumber: "BOX-A111",
            unitPrice: 3.0,
            allowAllocations: true,
            visible: true,
            gik: true,
            donorShippingNumber: "DN-2023-153",
            hfhShippingNumber: "HFH-2023-153",
          },
        ],
      },
    },
  });

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
      {
        generalItemId: archivedItem6.id,
        partnerId: internalPartner.id,
        quantity: 150,
        finalQuantity: 150,
        priority: RequestPriority.HIGH,
        comments: "Pain relief medication needed",
      },
      {
        generalItemId: archivedItem6.id,
        partnerId: externalPartner.id,
        quantity: 150,
        finalQuantity: 150,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem7.id,
        partnerId: internalPartner.id,
        quantity: 110,
        finalQuantity: 110,
        priority: RequestPriority.MEDIUM,
        comments: "Wound care supplies",
      },
      {
        generalItemId: archivedItem7.id,
        partnerId: externalPartner.id,
        quantity: 110,
        finalQuantity: 110,
        priority: RequestPriority.HIGH,
      },
      {
        generalItemId: archivedItem8.id,
        partnerId: internalPartner.id,
        quantity: 200,
        finalQuantity: 200,
        priority: RequestPriority.HIGH,
        comments: "Hygiene supplies for infection control",
      },
      {
        generalItemId: archivedItem8.id,
        partnerId: externalPartner.id,
        quantity: 200,
        finalQuantity: 200,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem9.id,
        partnerId: internalPartner.id,
        quantity: 125,
        finalQuantity: 125,
        priority: RequestPriority.HIGH,
        comments: "Diabetes management medication",
      },
      {
        generalItemId: archivedItem9.id,
        partnerId: externalPartner.id,
        quantity: 125,
        finalQuantity: 125,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem10.id,
        partnerId: internalPartner.id,
        quantity: 90,
        finalQuantity: 90,
        priority: RequestPriority.HIGH,
        comments: "Insulin administration supplies",
      },
      {
        generalItemId: archivedItem10.id,
        partnerId: externalPartner.id,
        quantity: 90,
        finalQuantity: 90,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem11.id,
        partnerId: internalPartner.id,
        quantity: 75,
        finalQuantity: 75,
        priority: RequestPriority.HIGH,
        comments: "Antibiotic for severe infections",
      },
      {
        generalItemId: archivedItem11.id,
        partnerId: externalPartner.id,
        quantity: 75,
        finalQuantity: 75,
        priority: RequestPriority.HIGH,
      },
      {
        generalItemId: archivedItem12.id,
        partnerId: internalPartner.id,
        quantity: 40,
        finalQuantity: 40,
        priority: RequestPriority.MEDIUM,
        comments: "Medical equipment for examinations",
      },
      {
        generalItemId: archivedItem12.id,
        partnerId: externalPartner.id,
        quantity: 40,
        finalQuantity: 40,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem13.id,
        partnerId: internalPartner.id,
        quantity: 175,
        finalQuantity: 175,
        priority: RequestPriority.HIGH,
        comments: "Maternal health supplement",
      },
      {
        generalItemId: archivedItem13.id,
        partnerId: externalPartner.id,
        quantity: 175,
        finalQuantity: 175,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem14.id,
        partnerId: internalPartner.id,
        quantity: 150,
        finalQuantity: 150,
        priority: RequestPriority.MEDIUM,
        comments: "Wound care supplies",
      },
      {
        generalItemId: archivedItem14.id,
        partnerId: externalPartner.id,
        quantity: 150,
        finalQuantity: 150,
        priority: RequestPriority.HIGH,
      },
      {
        generalItemId: archivedItem15.id,
        partnerId: internalPartner.id,
        quantity: 110,
        finalQuantity: 110,
        priority: RequestPriority.HIGH,
        comments: "Cardiovascular medication",
      },
      {
        generalItemId: archivedItem15.id,
        partnerId: externalPartner.id,
        quantity: 110,
        finalQuantity: 110,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem16.id,
        partnerId: internalPartner.id,
        quantity: 300,
        finalQuantity: 300,
        priority: RequestPriority.HIGH,
        comments: "PPE for staff protection",
      },
      {
        generalItemId: archivedItem16.id,
        partnerId: externalPartner.id,
        quantity: 300,
        finalQuantity: 300,
        priority: RequestPriority.HIGH,
      },
      {
        generalItemId: archivedItem17.id,
        partnerId: internalPartner.id,
        quantity: 135,
        finalQuantity: 135,
        priority: RequestPriority.MEDIUM,
        comments: "Blood pressure medication",
      },
      {
        generalItemId: archivedItem17.id,
        partnerId: externalPartner.id,
        quantity: 135,
        finalQuantity: 135,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem18.id,
        partnerId: internalPartner.id,
        quantity: 180,
        finalQuantity: 180,
        priority: RequestPriority.MEDIUM,
        comments: "Hygiene and disinfection supplies",
      },
      {
        generalItemId: archivedItem18.id,
        partnerId: externalPartner.id,
        quantity: 180,
        finalQuantity: 180,
        priority: RequestPriority.HIGH,
      },
      {
        generalItemId: archivedItem19.id,
        partnerId: internalPartner.id,
        quantity: 120,
        finalQuantity: 120,
        priority: RequestPriority.HIGH,
        comments: "Cardiovascular treatment",
      },
      {
        generalItemId: archivedItem19.id,
        partnerId: externalPartner.id,
        quantity: 120,
        finalQuantity: 120,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem20.id,
        partnerId: internalPartner.id,
        quantity: 100,
        finalQuantity: 100,
        priority: RequestPriority.MEDIUM,
        comments: "Medical tape for wound care",
      },
      {
        generalItemId: archivedItem20.id,
        partnerId: externalPartner.id,
        quantity: 100,
        finalQuantity: 100,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem21.id,
        partnerId: internalPartner.id,
        quantity: 130,
        finalQuantity: 130,
        priority: RequestPriority.MEDIUM,
        comments: "Gastrointestinal medication",
      },
      {
        generalItemId: archivedItem21.id,
        partnerId: externalPartner.id,
        quantity: 130,
        finalQuantity: 130,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem22.id,
        partnerId: internalPartner.id,
        quantity: 55,
        finalQuantity: 55,
        priority: RequestPriority.HIGH,
        comments: "Respiratory medication for asthma",
      },
      {
        generalItemId: archivedItem22.id,
        partnerId: externalPartner.id,
        quantity: 55,
        finalQuantity: 55,
        priority: RequestPriority.HIGH,
      },
      {
        generalItemId: archivedItem23.id,
        partnerId: internalPartner.id,
        quantity: 85,
        finalQuantity: 85,
        priority: RequestPriority.HIGH,
        comments: "Diabetes monitoring supplies",
      },
      {
        generalItemId: archivedItem23.id,
        partnerId: externalPartner.id,
        quantity: 85,
        finalQuantity: 85,
        priority: RequestPriority.MEDIUM,
      },
      // Requests for items 24-45
      {
        generalItemId: archivedItem24.id,
        partnerId: internalPartner.id,
        quantity: 100,
        finalQuantity: 100,
        priority: RequestPriority.HIGH,
        comments: "Cholesterol management medication",
      },
      {
        generalItemId: archivedItem24.id,
        partnerId: externalPartner.id,
        quantity: 100,
        finalQuantity: 100,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem25.id,
        partnerId: internalPartner.id,
        quantity: 80,
        finalQuantity: 80,
        priority: RequestPriority.MEDIUM,
        comments: "Muscle relaxant medication",
      },
      {
        generalItemId: archivedItem25.id,
        partnerId: externalPartner.id,
        quantity: 80,
        finalQuantity: 80,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem26.id,
        partnerId: internalPartner.id,
        quantity: 60,
        finalQuantity: 60,
        priority: RequestPriority.HIGH,
        comments: "Respiratory equipment supplies",
      },
      {
        generalItemId: archivedItem26.id,
        partnerId: externalPartner.id,
        quantity: 60,
        finalQuantity: 60,
        priority: RequestPriority.HIGH,
      },
      {
        generalItemId: archivedItem27.id,
        partnerId: internalPartner.id,
        quantity: 150,
        finalQuantity: 150,
        priority: RequestPriority.HIGH,
        comments: "Antiseptic for infection control",
      },
      {
        generalItemId: archivedItem27.id,
        partnerId: externalPartner.id,
        quantity: 150,
        finalQuantity: 150,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem28.id,
        partnerId: internalPartner.id,
        quantity: 140,
        finalQuantity: 140,
        priority: RequestPriority.HIGH,
        comments: "Antibiotic for various infections",
      },
      {
        generalItemId: archivedItem28.id,
        partnerId: externalPartner.id,
        quantity: 140,
        finalQuantity: 140,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem29.id,
        partnerId: internalPartner.id,
        quantity: 45,
        finalQuantity: 45,
        priority: RequestPriority.MEDIUM,
        comments: "Surgical instruments",
      },
      {
        generalItemId: archivedItem29.id,
        partnerId: externalPartner.id,
        quantity: 45,
        finalQuantity: 45,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem30.id,
        partnerId: internalPartner.id,
        quantity: 180,
        finalQuantity: 180,
        priority: RequestPriority.HIGH,
        comments: "Nutritional supplement for anemia",
      },
      {
        generalItemId: archivedItem30.id,
        partnerId: externalPartner.id,
        quantity: 180,
        finalQuantity: 180,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem31.id,
        partnerId: internalPartner.id,
        quantity: 70,
        finalQuantity: 70,
        priority: RequestPriority.HIGH,
        comments: "Respiratory therapy equipment",
      },
      {
        generalItemId: archivedItem31.id,
        partnerId: externalPartner.id,
        quantity: 70,
        finalQuantity: 70,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem32.id,
        partnerId: internalPartner.id,
        quantity: 120,
        finalQuantity: 120,
        priority: RequestPriority.HIGH,
        comments: "Blood thinner medication",
      },
      {
        generalItemId: archivedItem32.id,
        partnerId: externalPartner.id,
        quantity: 120,
        finalQuantity: 120,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem33.id,
        partnerId: internalPartner.id,
        quantity: 50,
        finalQuantity: 50,
        priority: RequestPriority.MEDIUM,
        comments: "Patient care supplies",
      },
      {
        generalItemId: archivedItem33.id,
        partnerId: externalPartner.id,
        quantity: 50,
        finalQuantity: 50,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem34.id,
        partnerId: internalPartner.id,
        quantity: 130,
        finalQuantity: 130,
        priority: RequestPriority.HIGH,
        comments: "Antibiotic for urinary infections",
      },
      {
        generalItemId: archivedItem34.id,
        partnerId: externalPartner.id,
        quantity: 130,
        finalQuantity: 130,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem35.id,
        partnerId: internalPartner.id,
        quantity: 90,
        finalQuantity: 90,
        priority: RequestPriority.MEDIUM,
        comments: "Medical supplies",
      },
      {
        generalItemId: archivedItem35.id,
        partnerId: externalPartner.id,
        quantity: 90,
        finalQuantity: 90,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem36.id,
        partnerId: internalPartner.id,
        quantity: 115,
        finalQuantity: 115,
        priority: RequestPriority.HIGH,
        comments: "Antibiotic for parasitic infections",
      },
      {
        generalItemId: archivedItem36.id,
        partnerId: externalPartner.id,
        quantity: 115,
        finalQuantity: 115,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem37.id,
        partnerId: internalPartner.id,
        quantity: 160,
        finalQuantity: 160,
        priority: RequestPriority.MEDIUM,
        comments: "Laboratory supplies",
      },
      {
        generalItemId: archivedItem37.id,
        partnerId: externalPartner.id,
        quantity: 160,
        finalQuantity: 160,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem38.id,
        partnerId: internalPartner.id,
        quantity: 100,
        finalQuantity: 100,
        priority: RequestPriority.MEDIUM,
        comments: "Thyroid medication",
      },
      {
        generalItemId: archivedItem38.id,
        partnerId: externalPartner.id,
        quantity: 100,
        finalQuantity: 100,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem39.id,
        partnerId: internalPartner.id,
        quantity: 55,
        finalQuantity: 55,
        priority: RequestPriority.MEDIUM,
        comments: "Surgical instruments",
      },
      {
        generalItemId: archivedItem39.id,
        partnerId: externalPartner.id,
        quantity: 55,
        finalQuantity: 55,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem40.id,
        partnerId: internalPartner.id,
        quantity: 200,
        finalQuantity: 200,
        priority: RequestPriority.MEDIUM,
        comments: "Calcium supplement",
      },
      {
        generalItemId: archivedItem40.id,
        partnerId: externalPartner.id,
        quantity: 200,
        finalQuantity: 200,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem41.id,
        partnerId: internalPartner.id,
        quantity: 75,
        finalQuantity: 75,
        priority: RequestPriority.MEDIUM,
        comments: "Medical supplies",
      },
      {
        generalItemId: archivedItem41.id,
        partnerId: externalPartner.id,
        quantity: 75,
        finalQuantity: 75,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem42.id,
        partnerId: internalPartner.id,
        quantity: 140,
        finalQuantity: 140,
        priority: RequestPriority.HIGH,
        comments: "Diuretic medication",
      },
      {
        generalItemId: archivedItem42.id,
        partnerId: externalPartner.id,
        quantity: 140,
        finalQuantity: 140,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem43.id,
        partnerId: internalPartner.id,
        quantity: 30,
        finalQuantity: 30,
        priority: RequestPriority.HIGH,
        comments: "Medical monitoring equipment",
      },
      {
        generalItemId: archivedItem43.id,
        partnerId: externalPartner.id,
        quantity: 30,
        finalQuantity: 30,
        priority: RequestPriority.HIGH,
      },
      {
        generalItemId: archivedItem44.id,
        partnerId: internalPartner.id,
        quantity: 220,
        finalQuantity: 220,
        priority: RequestPriority.MEDIUM,
        comments: "Vitamin supplement",
      },
      {
        generalItemId: archivedItem44.id,
        partnerId: externalPartner.id,
        quantity: 220,
        finalQuantity: 220,
        priority: RequestPriority.MEDIUM,
      },
      {
        generalItemId: archivedItem45.id,
        partnerId: internalPartner.id,
        quantity: 120,
        finalQuantity: 120,
        priority: RequestPriority.MEDIUM,
        comments: "Laboratory supplies",
      },
      {
        generalItemId: archivedItem45.id,
        partnerId: externalPartner.id,
        quantity: 120,
        finalQuantity: 120,
        priority: RequestPriority.MEDIUM,
      },
    ],
  });

  console.log("✓ Created archived donor offer");

  const allLineItems = await db.lineItem.findMany({
    where: {
      generalItem: {
        donorOfferId: archivedOffer.id,
      },
    },
  });

  const pendingDistribution = await db.distribution.create({
    data: {
      partnerId: internalPartner.id,
      pending: true,
    },
  });

  // Allocate multiple items from same shipment to pending distribution (no sign-off)
  // Use items from DN-2023-101/HFH-2023-101 shipment
  const pendingShipmentItems = allLineItems.filter(
    (li) =>
      li.donorShippingNumber === "DN-2023-101" &&
      li.hfhShippingNumber === "HFH-2023-101"
  );
  if (pendingShipmentItems.length >= 2) {
    await db.allocation.createMany({
      data: pendingShipmentItems.slice(0, 2).map((li) => ({
        lineItemId: li.id,
        partnerId: internalPartner.id,
        distributionId: pendingDistribution.id,
      })),
    });
  }

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

  // Allocate multiple items from same shipment to approved distribution with sign-off
  // Use items from DN-2023-104/HFH-2023-104 shipment
  const signedOffShipmentItems = allLineItems.filter(
    (li) =>
      li.donorShippingNumber === "DN-2023-104" &&
      li.hfhShippingNumber === "HFH-2023-104"
  );
  if (signedOffShipmentItems.length >= 2) {
    await db.allocation.createMany({
      data: signedOffShipmentItems.slice(0, 2).map((li) => ({
        lineItemId: li.id,
        partnerId: externalPartner.id,
        distributionId: approvedDistribution.id,
        signOffId: signOff.id,
      })),
    });
  }

  console.log("✓ Created approved distribution with sign-off");

  // Create approved distribution WITHOUT sign-off for testing signoff functionality
  const approvedDistributionNoSignOff = await db.distribution.create({
    data: {
      partnerId: externalPartner.id,
      pending: false,
    },
  });

  // Allocate items to approved distribution without sign-off (these can be selected for signoff)
  const readyShipmentItems = allLineItems.filter(
    (li) =>
      li.donorShippingNumber === "DN-2023-106" &&
      li.hfhShippingNumber === "HFH-2023-106"
  );
  const notReadyShipmentItems = allLineItems.filter(
    (li) =>
      li.donorShippingNumber === "DN-2023-108" &&
      li.hfhShippingNumber === "HFH-2023-108"
  );

  const testLineItems = [
    ...readyShipmentItems.slice(0, 2),
    ...notReadyShipmentItems.slice(0, 1),
  ];

  if (testLineItems.length >= 2) {
    await db.allocation.createMany({
      data: testLineItems.map((li) => ({
        lineItemId: li.id,
        partnerId: externalPartner.id,
        distributionId: approvedDistributionNoSignOff.id,
      })),
    });

    console.log(
      "✓ Created approved distribution without sign-off (for testing)"
    );
  }

  // Create shipping statuses for grouped shipments
  const shippingStatuses = [];

  // Create shipping statuses for shipments
  // Shipment 1 (DN-2023-101/HFH-2023-101) - with signed-off items, NOT ready
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-101",
    hfhShippingNumber: "HFH-2023-101",
    value: ShipmentStatus.ARRIVED_AT_DEPO, // NOT ready
  });

  // Shipment 2 (DN-2023-104/HFH-2023-104) - with signed-off items, READY
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-104",
    hfhShippingNumber: "HFH-2023-104",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION, // Ready
  });

  // Shipment 3 (DN-2023-106/HFH-2023-106) - unsigned items, READY (can be signed off)
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-106",
    hfhShippingNumber: "HFH-2023-106",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION, // Ready - can sign off
  });

  // Shipment 4 (DN-2023-108/HFH-2023-108) - unsigned items, NOT ready (button disabled)
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-108",
    hfhShippingNumber: "HFH-2023-108",
    value: ShipmentStatus.CLEARED_CUSTOMS, // NOT ready - button disabled
  });

  // Shipment 5 (DN-2023-114/HFH-2023-114) - unallocated items, READY
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-114",
    hfhShippingNumber: "HFH-2023-114",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION, // Ready - unallocated items
  });

  // Shipment 6 (DN-2023-115/HFH-2023-115) - unallocated items, READY
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-115",
    hfhShippingNumber: "HFH-2023-115",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION, // Ready - unallocated items
  });

  // Shipment 7 (DN-2023-116/HFH-2023-116) - unallocated items, READY
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-116",
    hfhShippingNumber: "HFH-2023-116",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION, // Ready - unallocated items
  });

  // Additional shipments for pagination testing
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-117",
    hfhShippingNumber: "HFH-2023-117",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-118",
    hfhShippingNumber: "HFH-2023-118",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-119",
    hfhShippingNumber: "HFH-2023-119",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-120",
    hfhShippingNumber: "HFH-2023-120",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-121",
    hfhShippingNumber: "HFH-2023-121",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-122",
    hfhShippingNumber: "HFH-2023-122",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-123",
    hfhShippingNumber: "HFH-2023-123",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-124",
    hfhShippingNumber: "HFH-2023-124",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-125",
    hfhShippingNumber: "HFH-2023-125",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-126",
    hfhShippingNumber: "HFH-2023-126",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-127",
    hfhShippingNumber: "HFH-2023-127",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-128",
    hfhShippingNumber: "HFH-2023-128",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-129",
    hfhShippingNumber: "HFH-2023-129",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-130",
    hfhShippingNumber: "HFH-2023-130",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-131",
    hfhShippingNumber: "HFH-2023-131",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  // Additional shipping statuses for items 24-45
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-132",
    hfhShippingNumber: "HFH-2023-132",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-133",
    hfhShippingNumber: "HFH-2023-133",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-134",
    hfhShippingNumber: "HFH-2023-134",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-135",
    hfhShippingNumber: "HFH-2023-135",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-136",
    hfhShippingNumber: "HFH-2023-136",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-137",
    hfhShippingNumber: "HFH-2023-137",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-138",
    hfhShippingNumber: "HFH-2023-138",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-139",
    hfhShippingNumber: "HFH-2023-139",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-140",
    hfhShippingNumber: "HFH-2023-140",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-141",
    hfhShippingNumber: "HFH-2023-141",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-142",
    hfhShippingNumber: "HFH-2023-142",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-143",
    hfhShippingNumber: "HFH-2023-143",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-144",
    hfhShippingNumber: "HFH-2023-144",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-145",
    hfhShippingNumber: "HFH-2023-145",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-146",
    hfhShippingNumber: "HFH-2023-146",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-147",
    hfhShippingNumber: "HFH-2023-147",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-148",
    hfhShippingNumber: "HFH-2023-148",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-149",
    hfhShippingNumber: "HFH-2023-149",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-150",
    hfhShippingNumber: "HFH-2023-150",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-151",
    hfhShippingNumber: "HFH-2023-151",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-152",
    hfhShippingNumber: "HFH-2023-152",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });
  shippingStatuses.push({
    donorShippingNumber: "DN-2023-153",
    hfhShippingNumber: "HFH-2023-153",
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
  });

  if (shippingStatuses.length > 0) {
    await db.shippingStatus.createMany({
      data: shippingStatuses,
    });
  }

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
        comments:
          "Needed for treating bacterial infections in our primary care clinic",
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
        comments:
          "Critical for dehydration cases especially during cholera outbreaks",
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

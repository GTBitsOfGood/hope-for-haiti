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
import FileService from "@/services/fileService";

const addDays = (daysFromToday: number) => {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + daysFromToday);
  return base;
};

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

  // Create staff users
  const superAdmin = await db.user.create({
    data: {
      email: "superadmin@test.com",
      name: "Super Admin",
      passwordHash,
      type: UserType.SUPER_ADMIN,
      enabled: true,
      pending: false,
    },
  });

  const admin = await db.user.create({
    data: {
      email: "admin@test.com",
      name: "Admin User",
      passwordHash,
      type: UserType.ADMIN,
      enabled: true,
      pending: false,
    },
  });

  const staff = await db.user.create({
    data: {
      email: "staff@test.com",
      name: "Staff Member",
      passwordHash,
      type: UserType.STAFF,
      enabled: true,
      pending: false,
    },
  });

  // Create partner users
  const internalPartner = await db.user.create({
    data: {
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
    },
  });

  const externalPartner = await db.user.create({
    data: {
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
    },
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
      staffMemberName: staff.name,
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

  if (shippingStatuses.length > 0) {
    await db.shippingStatus.createMany({
      data: shippingStatuses,
    });
  }

  console.log("✓ Created shipping statuses");

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
        `✓ Created ${unfinalizedItems.length} embeddings for unfinalized items`
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

import { exit } from "process";
import { hash } from "argon2";
import { UserType, DonorOfferState, ItemType, ItemCategory, ShipmentStatus } from "@prisma/client";

import { db } from "@/db";
import type { Prisma } from "@prisma/client";
import StreamIoService from "@/services/streamIoService";
import FileService from "@/services/fileService";
import UserService from "@/services/userService";
import { addDays, subDays } from "date-fns";

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

  // Delete all data
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
  await db.notification.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.user.deleteMany();
  await db.tag.deleteMany();

  const passwordHash = await hash("root");

  const internalTag = await db.tag.upsert({
    where: { name: "internal" },
    create: { name: "internal" },
    update: {},
  });

  const externalTag = await db.tag.upsert({
    where: { name: "external" },
    create: { name: "external" },
    update: {},
  });

  // Create super admin staff user
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

  // Standard Admin (Has userWrite, but NOT isSuper)
  // Use this account to see if it can deactivate partners but NOT Super Admins
  const staffAdmin = await createUser({
    email: "staffadmin@test.com",
    name: "Staff Admin",
    passwordHash,
    type: UserType.STAFF,
    enabled: true,
    pending: false,
    isSuper: false,
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

  // Create distribution lead staff user
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

  // Create first partner user
  const partner1 = await createUser({
    email: "partner1@test.com",
    name: "Hope Medical Center",
    passwordHash,
    type: UserType.PARTNER,
    tags: { connect: [{ id: internalTag.id }] },
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

  // Create second partner user
  const partner2 = await createUser({
    email: "partner2@test.com",
    name: "Les Cayes Community Hospital",
    passwordHash,
    type: UserType.PARTNER,
    tags: { connect: [{ id: externalTag.id }] },
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
  console.log(`  - Super Admin: ${superAdmin.email}`);
  console.log(`  - Staff Admin: ${staffAdmin.email}`);
  console.log(`  - Distribution Lead: ${distributionLead.email}`);
  console.log(`  - Partner 1: ${partner1.email}`);
  console.log(`  - Partner 2: ${partner2.email}`);

  // ============================================
  // Create mock data for reports testing
  // ============================================

  // Create donor offers
  const donorOffer1 = await db.donorOffer.create({
    data: {
      state: DonorOfferState.FINALIZED,
      offerName: "Direct Relief Medical Donation",
      donorName: "Direct Relief",
      partnerResponseDeadline: addDays(new Date(), 30),
      donorResponseDeadline: addDays(new Date(), 60),
    },
  });

  const donorOffer2 = await db.donorOffer.create({
    data: {
      state: DonorOfferState.FINALIZED,
      offerName: "Medication Supplies",
      donorName: "Global Health Initiative",
      partnerResponseDeadline: addDays(new Date(), 30),
      donorResponseDeadline: addDays(new Date(), 60),
    },
  });

  // Create general items
  const generalItem1 = await db.generalItem.create({
    data: {
      donorOfferId: donorOffer1.id,
      title: "Antibiotics (500 units)",
      expirationDate: addDays(new Date(), 365),
      unitType: "Box",
      initialQuantity: 500,
      type: ItemType.MEDICATION,
      category: ItemCategory.ANTIBIOTIC,
      weight: 5.0,
    },
  });

  const generalItem2 = await db.generalItem.create({
    data: {
      donorOfferId: donorOffer1.id,
      title: "Surgical Supplies (200 units)",
      expirationDate: addDays(new Date(), 365),
      unitType: "Box",
      initialQuantity: 200,
      type: ItemType.NON_MEDICATION,
      category: ItemCategory.SURGICAL,
      weight: 8.0,
    },
  });

  const generalItem3 = await db.generalItem.create({
    data: {
      donorOfferId: donorOffer2.id,
      title: "Pain Relievers (300 units)",
      expirationDate: addDays(new Date(), 365),
      unitType: "Box",
      initialQuantity: 300,
      type: ItemType.MEDICATION,
      category: ItemCategory.PAIN_RELIEVERS,
      weight: 3.5,
    },
  });

  // Create line items for shipment 1
  const lineItem1 = await db.lineItem.create({
    data: {
      donorName: "Direct Relief",
      quantity: 100,
      lotNumber: "LOT-2026-001",
      palletNumber: "P-001",
      boxNumber: "B-001",
      unitPrice: 50.0,
      hfhShippingNumber: "SH-001",
      donorShippingNumber: "DR-2026-001",
      generalItemId: generalItem1.id,
      allowAllocations: true,
      visible: true,
      gik: false,
    },
  });

  const lineItem2 = await db.lineItem.create({
    data: {
      donorName: "Direct Relief",
      quantity: 50,
      lotNumber: "LOT-2026-002",
      palletNumber: "P-001",
      boxNumber: "B-002",
      unitPrice: 120.0,
      hfhShippingNumber: "SH-001",
      donorShippingNumber: "DR-2026-001",
      generalItemId: generalItem2.id,
      allowAllocations: true,
      visible: true,
      gik: false,
    },
  });

  // Create line items for shipment 2
  const lineItem3 = await db.lineItem.create({
    data: {
      donorName: "Global Health Initiative",
      quantity: 75,
      lotNumber: "LOT-2026-003",
      palletNumber: "P-002",
      boxNumber: "B-003",
      unitPrice: 35.0,
      hfhShippingNumber: "SH-002",
      donorShippingNumber: "GHI-2026-001",
      generalItemId: generalItem3.id,
      allowAllocations: true,
      visible: true,
      gik: false,
    },
  });

  // Create distributions
  const distribution1 = await db.distribution.create({
    data: {
      partnerId: partner1.id,
      pending: false,
    },
  });

  const distribution2 = await db.distribution.create({
    data: {
      partnerId: partner2.id,
      pending: false,
    },
  });

  // Create allocations
  const allocation1 = await db.allocation.create({
    data: {
      partnerId: partner1.id,
      lineItemId: lineItem1.id,
      distributionId: distribution1.id,
    },
  });

  const allocation2 = await db.allocation.create({
    data: {
      partnerId: partner1.id,
      lineItemId: lineItem2.id,
      distributionId: distribution1.id,
    },
  });

  const allocation3 = await db.allocation.create({
    data: {
      partnerId: partner2.id,
      lineItemId: lineItem3.id,
      distributionId: distribution2.id,
    },
  });

  // Create sign-offs (completed shipments)
  const signOff1 = await db.signOff.create({
    data: {
      staffMemberName: distributionLead.name,
      partnerId: partner1.id,
      partnerName: partner1.name,
      partnerSignerName: "Dr. Jean Baptiste",
      date: subDays(new Date(), 10),
      signatureUrl: null,
      partnerSignatureUrl: null,
      allocations: {
        connect: [{ id: allocation1.id }, { id: allocation2.id }],
      },
    },
  });

  const signOff2 = await db.signOff.create({
    data: {
      staffMemberName: distributionLead.name,
      partnerId: partner2.id,
      partnerName: partner2.name,
      partnerSignerName: "Dr. Marie Joseph",
      date: subDays(new Date(), 5),
      signatureUrl: null,
      partnerSignatureUrl: null,
      allocations: {
        connect: [{ id: allocation3.id }],
      },
    },
  });

  // Create ShippingStatus records for the shipments
  // These are needed for the Sign-offs table to display the shipments
  const shippingStatus1 = await db.shippingStatus.create({
    data: {
      hfhShippingNumber: "SH-001",
      donorShippingNumber: "DR-2026-001",
      value: ShipmentStatus.READY_FOR_DISTRIBUTION,
    },
  });

  const shippingStatus2 = await db.shippingStatus.create({
    data: {
      hfhShippingNumber: "SH-002",
      donorShippingNumber: "GHI-2026-001",
      value: ShipmentStatus.READY_FOR_DISTRIBUTION,
    },
  });

  console.log("✓ Created mock report data");
  console.log(`  - 2 Donor Offers with 3 General Items`);
  console.log(`  - 3 Line Items (2 shipments)`);
  console.log(`  - 2 Sign-Offs for testing reports`);
  console.log(`  - 2 ShippingStatus records for Sign-offs display`);
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

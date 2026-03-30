import { exit } from "process";
import { hash } from "argon2";
import { UserType } from "@prisma/client";

import { db } from "@/db";
import type { Prisma } from "@prisma/client";
import StreamIoService from "@/services/streamIoService";
import FileService from "@/services/fileService";
import UserService from "@/services/userService";

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

  const passwordHash = await hash("root");

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

  // Create second partner user
  const partner2 = await createUser({
    email: "partner2@test.com",
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
  console.log(`  - Super Admin: ${superAdmin.email}`);
  console.log(`  - Distribution Lead: ${distributionLead.email}`);
  console.log(`  - Partner 1: ${partner1.email}`);
  console.log(`  - Partner 2: ${partner2.email}`);
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

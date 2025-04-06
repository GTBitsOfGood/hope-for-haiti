/* eslint-disable @typescript-eslint/no-unused-vars */
import { exit } from "process";
import { db } from "@/db";
import { hash } from "argon2";
import {
  DonorOffer,
  DonorOfferState,
  Item,
  ItemCategory,
  Prisma,
  RequestPriority,
  UserType,
} from "@prisma/client";
import { GeneralItem } from "@/types";

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

function randInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const generalItems: Array<GeneralItem> = [
  {
    title: "Advil",
    type: "Pain Killer",
    expirationDate: dateOffset(30),
    unitType: "Bottle",
    quantityPerUnit: 50,
  },
  {
    title: "Tylenol",
    type: "Pain Killer",
    expirationDate: dateOffset(4 * 30),
    unitType: "Bottle",
    quantityPerUnit: 20,
  },
  {
    title: "Bandages",
    type: "First Aid",
    expirationDate: null,
    unitType: "Box",
    quantityPerUnit: 100,
  },
  {
    title: "Apples",
    type: "Fruit",
    expirationDate: dateOffset(15),
    unitType: "Box",
    quantityPerUnit: 4,
  },
  {
    title: "Bananas",
    type: "Fruit",
    expirationDate: dateOffset(15),
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
    expirationDate: dateOffset(30),
    unitType: "Bottle",
    quantityPerUnit: 50,
    category: ItemCategory.MEDICATION,
    unitPrice: new Prisma.Decimal(10),
    maxRequestLimit: null,
  },
  {
    title: "Tylenol",
    type: "Pain Killer",
    expirationDate: dateOffset(4 * 30),
    unitType: "Bottle",
    quantityPerUnit: 20,
    category: ItemCategory.MEDICATION,
    unitPrice: new Prisma.Decimal(5),
    maxRequestLimit: null,
  },
  {
    title: "Bandages",
    type: "First Aid",
    expirationDate: null,
    unitType: "Box",
    quantityPerUnit: 100,
    category: ItemCategory.MEDICAL_SUPPLY,
    unitPrice: new Prisma.Decimal(25),
    maxRequestLimit: null,
  },
  {
    title: "Apples",
    type: "Fruit",
    expirationDate: dateOffset(15),
    unitType: "Box",
    quantityPerUnit: 4,
    category: ItemCategory.NON_MEDICAL,
    unitPrice: new Prisma.Decimal(2),
    maxRequestLimit: null,
  },
  {
    title: "Bananas",
    type: "Fruit",
    expirationDate: dateOffset(15),
    unitType: "Bundle",
    quantityPerUnit: 4,
    category: ItemCategory.NON_MEDICAL,
    unitPrice: new Prisma.Decimal(1.5),
    maxRequestLimit: null,
  },
];

function genItem(props: Partial<Item> = {}): Omit<Item, "id"> {
  return {
    ...pick(itemTemplates),
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
    allowAllocations: false,
    visible: false,
    gik: false,
    donorOfferItemId: null,
    ...props,
  };
}

async function run() {
  await db.$transaction(async (tx) => {
    await tx.donorOfferPartnerVisibility.deleteMany();
    await tx.distribution.deleteMany();
    await tx.donorOfferItemRequestAllocation.deleteMany();
    await tx.donorOfferItemRequest.deleteMany();
    await tx.donorOfferItem.deleteMany();
    await tx.donorOffer.deleteMany();
    await tx.unallocatedItemRequestAllocation.deleteMany();
    await tx.unallocatedItemRequest.deleteMany();
    await tx.user.deleteMany();
    await tx.userInvite.deleteMany();
    await tx.item.deleteMany();

    const pwHash = await hash("root");

    const superadmin = await tx.user.create({
      data: {
        email: "superadmin@test.com",
        passwordHash: pwHash,
        type: UserType.SUPER_ADMIN,
        name: "Super Admin",
      },
    });
    const admin = await tx.user.create({
      data: {
        email: "admin@test.com",
        passwordHash: pwHash,
        type: UserType.ADMIN,
        name: "Admin",
      },
    });
    const staff = await tx.user.create({
      data: {
        email: "staff@test.com",
        passwordHash: pwHash,
        type: "STAFF",
        name: "Staff",
      },
    });
    const partners = await tx.user.createManyAndReturn({
      data: Array.from({ length: 20 }, (_, i) => i).map((i: number) => ({
        email: `partner${i + 1}@test.com`,
        passwordHash: pwHash,
        type: "PARTNER",
        name: `Partner ${i + 1}`,
        partnerDetails: {},
      })),
    });

    await tx.userInvite.create({
      data: {
        email: "new-admin@test.com",
        expiration: new Date("July 24, 3000"),
        name: "New Admin",
        token: "1234",
        userType: "ADMIN",
      },
    });

    const items = await tx.item.createManyAndReturn({
      data: Array.from({ length: 100 }, () => genItem()),
    });

    const unallocatedItemRequests =
      await tx.unallocatedItemRequest.createManyAndReturn({
        data: Array.from({ length: 20 }, () => {
          const genItem = pick(generalItems);
          return {
            partnerId: pick(partners).id,
            ...genItem,
            priority: pick(Object.keys(RequestPriority)) as RequestPriority,
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
              create: Array.from({ length: 4 }, () => ({
                quantity: randInt(1, 3) * 10,
                ...pick(generalItems),
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
              create: Array.from({ length: 4 }, () => ({
                quantity: randInt(1, 3) * 10,
                ...pick(generalItems),
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
              create: Array.from({ length: 4 }, () => ({
                quantity: randInt(1, 3) * 10,
                ...pick(generalItems),
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
              create: Array.from({ length: 4 }, () => ({
                quantity: randInt(1, 3) * 10,
                ...pick(generalItems),
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

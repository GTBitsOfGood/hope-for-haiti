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

const generalItems: Array<{
  title: string;
  type: string;
  unitSize: number;
}> = [
  {
    title: "Advil",
    type: "Pain Killer",
    unitSize: 10,
  },
  {
    title: "Tylenol",
    type: "Pain Killer",
    unitSize: 10,
  },
  {
    title: "Bandages",
    type: "First Aid",
    unitSize: 100,
  },
  {
    title: "Apples",
    type: "Fruit",
    unitSize: 1,
  },
  {
    title: "Bananas",
    type: "Fruit",
    unitSize: 3,
  },
];

async function run() {
  await db.$transaction(async (tx) => {
    await tx.donorOfferPartnerVisibility.deleteMany();
    await tx.donorOfferItemRequest.deleteMany();
    await tx.donorOfferItem.deleteMany();
    await tx.donorOffer.deleteMany();
    await tx.unallocatedItemRequestAllocation.deleteMany();
    await tx.unallocatedItemRequest.deleteMany();
    await tx.user.deleteMany();
    await tx.userInvite.deleteMany();
    await tx.item.deleteMany();

    const superadmin = await tx.user.create({
      data: {
        email: "superadmin@test.com",
        passwordHash: await hash("root"),
        type: UserType.SUPER_ADMIN,
        name: "Super Admin",
      },
    });
    const admin = await tx.user.create({
      data: {
        email: "admin@test.com",
        passwordHash: await hash("root"),
        type: UserType.ADMIN,
        name: "Admin",
      },
    });
    const staff = await tx.user.create({
      data: {
        email: "staff@test.com",
        passwordHash: await hash("root"),
        type: "STAFF",
        name: "Staff",
      },
    });
    const partner = await tx.user.create({
      data: {
        email: "partner@test.com",
        passwordHash: await hash("root"),
        type: "PARTNER",
        name: "Partner",
        partnerDetails: {},
      },
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

    const items = await Promise.all(
      (
        [
          {
            title: "Advil",
            type: "Pain Killer",
            expirationDate: dateOffset(15),
            unitSize: 10,
            unitType: "Pills / Bottle",
            category: ItemCategory.MEDICATION,
            donorName: "Donor A",
            quantity: 30,
            lotNumber: 7,
            palletNumber: 24,
            boxNumber: 2000,
            unitPrice: new Prisma.Decimal(10),
            allowAllocations: true,
            visible: true,
            gik: false,
          },
          {
            title: "Tylenol",
            type: "Pain Killer",
            expirationDate: dateOffset(30 * 3 + 15),
            unitSize: 10,
            unitType: "Pills / Bottle",
            category: ItemCategory.MEDICATION,
            donorName: "Donor B",
            quantity: 30,
            lotNumber: 1,
            palletNumber: 2,
            boxNumber: 2003,
            unitPrice: new Prisma.Decimal(4),
            allowAllocations: true,
            visible: true,
            gik: false,
          },
          {
            title: "Apples",
            type: "Fruit",
            expirationDate: dateOffset(5),
            unitSize: 1,
            unitType: "Count",
            category: ItemCategory.NON_MEDICAL,
            donorName: "Donor B",
            quantity: 1000,
            lotNumber: 1,
            palletNumber: 2,
            boxNumber: 2021,
            unitPrice: new Prisma.Decimal(4),
            allowAllocations: true,
            visible: true,
            gik: false,
          },
          {
            title: "Bananas",
            type: "Fruit",
            expirationDate: dateOffset(2),
            unitSize: 4,
            unitType: "Count / Bunch",
            category: ItemCategory.NON_MEDICAL,
            donorName: "Donor C",
            quantity: 1000,
            lotNumber: 1,
            palletNumber: 2,
            boxNumber: 2022,
            unitPrice: new Prisma.Decimal(4),
            allowAllocations: true,
            visible: true,
            gik: false,
          },
          {
            title: "Banadage",
            type: "First Aid",
            expirationDate: dateOffset(1000),
            unitSize: 100,
            unitType: "Count / Box",
            category: ItemCategory.MEDICAL_SUPPLY,
            donorName: "Donor D",
            quantity: 1000,
            lotNumber: 1,
            palletNumber: 2,
            boxNumber: 2004,
            unitPrice: new Prisma.Decimal(4),
            allowAllocations: true,
            visible: true,
            gik: false,
          },
        ] as Item[]
      ).map((data) => tx.item.create({ data }))
    );

    await Promise.all(
      items.map((item) =>
        tx.unallocatedItemRequest.create({
          data: {
            partnerId: partner.id,
            title: item.title,
            type: item.type,
            expirationDate: item.expirationDate,
            unitSize: item.unitSize,
            priority: RequestPriority.MEDIUM,
            quantity: 2,
            comments: "pls",
          },
        })
      )
    );

    const donorOffers = await Promise.all(
      (
        [
          {
            state: DonorOfferState.UNFINALIZED,
            offerName: "Offer A",
            donorName: "Donor A",
            partnerResponseDeadline: dateOffset(20),
            donorResponseDeadline: dateOffset(30),
          },
          {
            state: DonorOfferState.UNFINALIZED,
            offerName: "Offer B",
            donorName: "Donor B",
            partnerResponseDeadline: dateOffset(20),
            donorResponseDeadline: dateOffset(30),
          },
          {
            state: DonorOfferState.UNFINALIZED,
            offerName: "Offer C",
            donorName: "Donor C",
            partnerResponseDeadline: dateOffset(20),
            donorResponseDeadline: dateOffset(30),
          },
          {
            state: DonorOfferState.UNFINALIZED,
            offerName: "Offer D",
            donorName: "Donor D",
            partnerResponseDeadline: dateOffset(20),
            donorResponseDeadline: dateOffset(30),
          },
        ] as DonorOffer[]
      ).map((data) => tx.donorOffer.create({ data }))
    );

    await Promise.all(
      donorOffers.map((offer) =>
        Promise.all(
          [
            {
              donorOfferId: offer.id,
              ...pick(generalItems),
              quantity: Math.floor(1 + Math.random() * 8),
            },
            {
              donorOfferId: offer.id,
              ...pick(generalItems),
              quantity: Math.floor(1 + Math.random() * 8),
            },
            {
              donorOfferId: offer.id,
              ...pick(generalItems),
              quantity: Math.floor(1 + Math.random() * 8),
            },
          ].map((data) => tx.donorOfferItem.create({ data }))
        )
      )
    );

    const partners = await tx.user.findMany({
      where: {
        type: UserType.PARTNER,
      },
    });

    await Promise.all(
      donorOffers.slice(0, 2).flatMap((offer) =>
        partners.map((partner) =>
          tx.donorOfferPartnerVisibility.create({
            data: {
              donorOfferId: offer.id,
              partnerId: partner.id,
            },
          })
        )
      )
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

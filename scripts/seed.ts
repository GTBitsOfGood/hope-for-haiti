import "dotenv/config";
import { exit } from "process";
import { db } from "@/db";
import { hash } from "argon2";
import { UserType } from "@prisma/client";

async function run() {
  await db.$transaction(async (tx) => {
    await tx.requestedUnclaimedItem.deleteMany();
    await tx.unclaimedItemRequest.deleteMany();
    await tx.unclaimedItem.deleteMany();
    await tx.partnerDetails.deleteMany();
    await tx.user.deleteMany();

    await tx.user.createMany({
      data: [
        {
          email: "superadmin@test.com",
          passwordHash: await hash("root"),
          type: UserType.SUPER_ADMIN,
        },
        {
          email: "admin@test.com",
          passwordHash: await hash("root"),
          type: UserType.ADMIN,
        },
        {
          email: "staff@test.com",
          passwordHash: await hash("root"),
          type: "STAFF",
        },
        {
          email: "partner@test.com",
          passwordHash: await hash("root"),
          type: "PARTNER",
        },
      ],
    });

    await tx.partnerDetails.create({
      data: {
        user: {
          connect: {
            email: "partner@test.com",
          },
        },
      },
    });

    const banana = await tx.unclaimedItem.create({
      data: { name: "Banana", quantity: 10, expirationDate: new Date() },
    });

    const apple = await tx.unclaimedItem.create({
      data: { name: "Apple", quantity: 100, expirationDate: new Date() },
    });

    await tx.unclaimedItemRequest.create({
      data: {
        items: {
          createMany: {
            data: [
              {
                itemId: banana.id,
                quantity: 5,
              },
              {
                itemId: apple.id,
                quantity: 10,
              },
            ],
          },
        },
        partner: { connect: { email: "partner@test.com" } },
      },
    });
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

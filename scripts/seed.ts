import "dotenv/config";
import { exit } from "process";
import { db } from "@/db";
import { hash } from "argon2";
import { UserType } from "@prisma/client";

async function run() {
  await db.$transaction(async (tx) => {
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

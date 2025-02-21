import { exit } from "process";
import { db } from "@/db";
import { hash } from "argon2";
import { UserType } from "@prisma/client";

async function run() {
  await db.$transaction(async (tx) => {
    await tx.user.deleteMany();
    await tx.userInvite.deleteMany();
    await tx.item.deleteMany();
    await tx.unallocatedItemRequest.deleteMany();

    await tx.user.createMany({
      data: [
        {
          email: "superadmin@test.com",
          passwordHash: await hash("root"),
          type: UserType.SUPER_ADMIN,
          name: "Super Admin",
        },
        {
          email: "admin@test.com",
          passwordHash: await hash("root"),
          type: UserType.ADMIN,
          name: "Admin",
        },
        {
          email: "staff@test.com",
          passwordHash: await hash("root"),
          type: "STAFF",
          name: "Staff",
        },
        {
          email: "partner@test.com",
          passwordHash: await hash("root"),
          type: "PARTNER",
          name: "Partner",
          partnerDetails: {},
        },
      ],
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

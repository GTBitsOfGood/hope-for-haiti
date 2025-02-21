import { exit } from "process";
import { db } from "@/db";

async function run() {
  await db.$transaction(async (tx) => {
    await tx.user.deleteMany();
    await tx.userInvite.deleteMany();
    await tx.item.deleteMany();
    await tx.unallocatedItemRequest.deleteMany();
  });
}

run()
  .then(() => {
    console.info("DB cleared");

    exit(0);
  })
  .catch((err) => {
    console.error("Error clearing DB");
    console.error(err);

    exit(1);
  });

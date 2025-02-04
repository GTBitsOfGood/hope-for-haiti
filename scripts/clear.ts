import "dotenv/config";
import { exit } from "process";
import { db } from "@/db";

async function run() {
  await db.$transaction(async (tx) => {
    await tx.unallocatedItemRequest.deleteMany();
    await tx.item.deleteMany();
    await tx.requestedUnclaimedItem.deleteMany();
    await tx.unclaimedItemRequest.deleteMany();
    await tx.unclaimedItem.deleteMany();
    await tx.userInvite.deleteMany();
    await tx.partnerDetails.deleteMany();
    await tx.user.deleteMany();
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

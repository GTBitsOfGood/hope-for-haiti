import { exit } from "process";
import { db } from "@/db";

async function run() {
  await db.$transaction(async (tx) => {
    await tx.shippingStatus.deleteMany();
    await tx.donorOffer.deleteMany();
    await tx.distribution.deleteMany();
    await tx.signOff.deleteMany();
    await tx.user.deleteMany();
    await tx.userInvite.deleteMany();
    await tx.generalItem.deleteMany();
    await tx.lineItem.deleteMany();
    await tx.wishlist.deleteMany();
    await tx.allocation.deleteMany();
    await tx.generalItemRequest.deleteMany();
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

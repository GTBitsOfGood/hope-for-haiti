import { exit } from "process";
import { db } from "@/db";

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

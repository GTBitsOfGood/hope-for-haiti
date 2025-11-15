import { exit } from "process";
import { db } from "@/db";
import FileService from "@/services/fileService";

async function run() {
  await db.$transaction(async (tx) => {
    // Get all signoffs with signature URLs before deleting
    const signOffs = await tx.signOff.findMany({
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

    // Now delete from database
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

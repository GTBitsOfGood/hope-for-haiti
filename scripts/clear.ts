import { exit } from "process";
import { db } from "@/db";
import StreamIoService from "@/services/streamIoService";
import FileService from "@/services/fileService";

async function deleteAllStreamUsers() {
  const users = (await db.user.findMany({
    where: {
      streamUserId: {
        not: null,
      },
    },
    select: {
      streamUserId: true,
    },
  })) as { streamUserId: string }[];

  await Promise.all(
    users.map(async (user) => {
      await StreamIoService.hardDeleteUser(user.streamUserId);
    })
  );
}

async function deleteAllStreamChannels() {
  await StreamIoService.deleteAllChannels();
}

async function run() {
  await deleteAllStreamChannels();
  await deleteAllStreamUsers();

  await db.$transaction(async (tx) => {
    const signOffs = await tx.signOff.findMany({
      select: {
        signatureUrl: true,
      },
    });

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

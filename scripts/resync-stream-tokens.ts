import { exit } from "process";
import { db } from "@/db";
import StreamIoService from "@/services/streamIoService";
import UserService from "@/services/userService";

async function main() {
  const users = await db.user.findMany();

  await db.user.updateMany({ data: { streamUserId: null, streamUserToken: null } });

  for (const user of users) {
    const { userId, userToken } = await StreamIoService.createUser(
      { email: user.email, name: user.name ?? user.email },
      UserService.isStaff(user)
    );
    await db.user.update({
      where: { id: user.id },
      data: { streamUserId: userId, streamUserToken: userToken },
    });
    console.log(`Updated stream token for ${user.email}`);
  }

  console.log(`Done — updated ${users.length} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    exit(1);
  })
  .finally(() => db.$disconnect());

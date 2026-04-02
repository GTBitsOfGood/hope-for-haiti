import { db } from "@/db";

async function migrateTags() {
  const usersWithTags = await db.user.findMany({
    where: {
      tag: {
        not: null,
      },
    },
    select: {
      id: true,
      tag: true,
    },
  });

  console.log(`Found ${usersWithTags.length} users with tags`);

  const distinctTags = [...new Set(usersWithTags.map((u) => u.tag as string))];
  console.log(
    `Found ${distinctTags.length} distinct tag values: ${distinctTags.join(", ")}`
  );

  const tagMap = new Map<string, number>();

  for (const tagName of distinctTags) {
    const tag = await db.tag.upsert({
      where: { name: tagName },
      create: { name: tagName },
      update: {},
    });
    tagMap.set(tagName, tag.id);
    console.log(`  Tag "${tagName}" -> id ${tag.id}`);
  }

  let connectionsCreated = 0;
  for (const user of usersWithTags) {
    const tagName = user.tag as string;
    const tagId = tagMap.get(tagName);
    if (tagId) {
      await db.user.update({
        where: { id: user.id },
        data: {
          tags: {
            connect: { id: tagId },
          },
        },
      });
      connectionsCreated++;
    }
  }

  console.log(`Created ${connectionsCreated} user-tag connections`);
  console.log("Tag migration complete!");
}

migrateTags()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

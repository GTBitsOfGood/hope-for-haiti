// scripts/seed-chroma.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { MatchingService } from "@/services/matchingService";

/**
 * This script:
 * 1) Reads GeneralItem rows from your DB
 * 2) Maps them into the shape expected by MatchingService.add(...)
 *    - id        -> Chroma id
 *    - title     -> Chroma document
 *    - donorOfferId -> Chroma metadata
 * 3) Seeds Chroma in safe batches
 *
 * Assumptions:
 * - MatchingService.add(items) will embed titles with OpenAI and write to Chroma
 *   (consistent with how your previous seed used MatchingService.add on sample titles).
 */

const prisma = new PrismaClient();

// tune batching to avoid large payloads
const BATCH_SIZE = 200;

type SeedItem = {
  id: number;
  title: string;
  donorOfferId: number;
};

async function fetchGeneralItems(): Promise<SeedItem[]> {
  const rows = await prisma.generalItem.findMany({
    select: { id: true, title: true, donorOfferId: true },
    orderBy: { id: "asc" },
  });

  // drop any rows without a reasonable title
  return rows
    .filter((r) => r.title && r.title.trim().length > 0)
    .map((r) => ({
      id: r.id,
      title: r.title.trim(),
      donorOfferId: r.donorOfferId,
    }));
}

async function seed() {
  const items = await fetchGeneralItems();
  console.log(
    `Seeding Chroma vector store with ${items.length} general items…`
  );

  // chunk to avoid large single requests
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    await MatchingService.add(batch);
    console.log(
      `  → seeded ${Math.min(i + BATCH_SIZE, items.length)} / ${items.length}`
    );
  }

  console.log("Seed complete ✅");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

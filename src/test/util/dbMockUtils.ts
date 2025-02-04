import { dbMock } from "@/test/dbMock";
import { UnclaimedItem } from "@prisma/client";

// Helper util methods for testing

/**
 * Helper method for creating unclaimed items
 * Defines the db.unclaimedItem.findMany mock
 * @param num Number of items to create
 * @returns Array of UnclaimedItems returned by db.unclaimedItem.findMany mock
 */
export async function fillDbMockWithManyUnclaimedItems(
  num: number
): Promise<UnclaimedItem[]> {
  const items: UnclaimedItem[] = [];
  const generatedIds = new Set<number>();

  for (let i = 0; i < num; i++) {
    let id: number;
    do {
      id = Math.floor(Math.random() * 1000000); // Generate a random integer ID
    } while (generatedIds.has(id)); // Ensure the ID is unique

    generatedIds.add(id);

    items.push({
      id: id,
      name: `Test Item ${id}`,
      quantity: Math.floor(Math.random() * 1000),
      expirationDate: new Date(Date.now() + Math.floor(Math.random() * 10000)),
    });
  }

  dbMock.unclaimedItem.findMany.mockResolvedValue(items);
  return items;
}

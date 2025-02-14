import { dbMock } from "@/test/dbMock";
import { Item, UnclaimedItem } from "@prisma/client";

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

/**
 * Helper method for creating a single unclaimed item.
 * Only the id and title are 100% untouchable by caller.
 */
export async function createUnclaimedItem({
  id = Math.floor(Math.random() * 10000),
  title = `Test Item ${id}`,
  category = "Test Category",
  quantity = 10,
  expirationDate = new Date(Date.now() + Math.floor(Math.random() * 10000)),
  unitSize = 1,
  unitType = "Test Unit",
  datePosted = new Date(),
  lotNumber = Math.floor(Math.random() * 10000),
  donorName = "Test Donor",
  unitPrice = 0,
  maxRequestLimit = "1",
}: {
  id?: number;
  title?: string;
  category?: string;
  quantity?: number;
  expirationDate?: Date;
  unitSize?: number;
  unitType?: string;
  datePosted?: Date;
  lotNumber?: number;
  donorName?: string;
  unitPrice?: number;
  maxRequestLimit?: string;
}): Promise<Item> {
  return {
    id,
    title,
    category,
    quantity,
    expirationDate,
    unitSize,
    unitType,
    datePosted,
    lotNumber,
    donorName,
    unitPrice,
    maxRequestLimit,
  };
}

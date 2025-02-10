import { dbMock } from "@/test/dbMock";
import { UnallocatedItemRequest, UnclaimedItem } from "@prisma/client";

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

export async function fillDbMockWithUnallocatedItemRequestsForItemIdFiltering(
  num: number
) {
  const numberOfItems = 10;
  const numberOfPartners = 10;

  const unallocatedItemRequests: UnallocatedItemRequest[] = [];

  for (let i = 0; i < num; i++) {
    unallocatedItemRequests.push({
      id: i,
      quantity: Math.floor(Math.random() * 1000),
      partnerId: Math.floor(Math.random() * numberOfPartners),
      itemId: 1,
      comments: "Test unallocated item request " + i,
    });
  }

  dbMock.unallocatedItemRequest.findMany.mockResolvedValue(
    unallocatedItemRequests
  );
}

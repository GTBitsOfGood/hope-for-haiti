import { dbMock } from "@/test/dbMock";
import { UnallocatedItemRequest, Item } from "@prisma/client";

// Helper util methods for testing

/**
 * Helper method for creating unclaimed items
 * Defines the db.unclaimedItem.findMany mock
 * @param num Number of items to create
 * @returns Array of UnclaimedItems returned by db.unclaimedItem.findMany mock
 */
export async function fillDbMockWithManyItems(
  num: number,
  dates?: Date[]
): Promise<Item[]> {
  if (dates && dates.length !== num) {
    throw new Error("Number of dates must match number of items");
  }

  const items: Item[] = [];
  const generatedIds = new Set<number>();

  for (let i = 0; i < num; i++) {
    let id: number;
    do {
      id = Math.floor(Math.random() * 1000000); // Generate a random integer ID
    } while (generatedIds.has(id)); // Ensure the ID is unique

    generatedIds.add(id);

    items.push({
      id: id,
      title: `Test Item ${id}`,
      category: `Test Category ${Math.floor(Math.random() * 3)}`,
      quantity: Math.floor(Math.random() * 1000),
      expirationDate: dates
        ? dates[i]
        : new Date(Date.now() + Math.floor(Math.random() * 10000)),
      unitSize: Math.floor(Math.random() * 100),
      unitType: `Unit Type ${Math.floor(Math.random() * 3)}`,
      datePosted: new Date(Date.now() + Math.floor(Math.random() * 10000)),
      lotNumber: Math.floor(Math.random() * 100),
      donorName: "Chris Evans <3",
      unitPrice: Math.random() * 100,
      maxRequestLimit: "abc",
    });
  }

  dbMock.item.findMany.mockResolvedValue(items);
  return items;
}

export async function fillDbMockWithUnallocatedItemRequestsForItemIdFiltering(
  num: number
) {
  // const numberOfItems = 10;
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
}

export async function fillDbMockWithUnallocatedItemRequestsForPartnerIdFilter(
  num: number
) {
  const partnerId = 1;
  const numOfItems = 10;

  const unallocatedItemRequests = [];
  for (let i = 0; i < num; i++) {
    unallocatedItemRequests.push({
      id: i,
      partnerId: partnerId,
      itemId: Math.floor(Math.random() * numOfItems),
      quantity: Math.floor(Math.random() * 100),
      comments: `Test comment ${i}`,
    });
  }
  dbMock.unallocatedItemRequest.findMany.mockResolvedValue(
    unallocatedItemRequests
  );
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

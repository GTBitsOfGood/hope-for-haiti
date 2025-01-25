import { dbMock } from "@/test/dbMock";
import { UnclaimedItem } from "@prisma/client";


// Helper util methods for testing


/**
 * Helper method for creating unclaimed items
 * Defines the db.unclaimedItem.findMany mock
 * @param num Number of items to create
 * @returns Array of UnclaimedItems returned by db.unclaimedItem.findMany mock
 */
export async function manyUnclaimedItems(num: number): Promise<UnclaimedItem[]> {
    const items: UnclaimedItem[] = [];
    for (let i = 0; i < num; i++) {
        items.push({id: i, name: `Test Item ${i}`, quantity: i, expirationDate: new Date()});
    }
    dbMock.unclaimedItem.findMany.mockResolvedValue(items);
    return items;
}
import { dbMock } from "@/test/dbMock";
import { Item, ItemCategory, Prisma } from "@prisma/client";

// Helper util methods for testing

/**
 * Helper method for creating unclaimed items
 * Defines the db.item.findMany mock
 * @param num Number of items to create
 * @returns Array of items returned by db.item.findMany mock
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
      type: "asdsa",
      category: ItemCategory.MEDICAL_SUPPLY,
      quantity: Math.floor(Math.random() * 1000),
      expirationDate: dates
        ? dates[i]
        : new Date(Date.now() + Math.floor(Math.random() * 10000)),
      unitType: `Unit Type ${Math.floor(Math.random() * 3)}`,
      datePosted: new Date(Date.now() + Math.floor(Math.random() * 10000)),
      lotNumber: Math.floor(Math.random() * 100).toString(),
      palletNumber: Math.floor(Math.random() * 100).toString(),
      boxNumber: Math.floor(Math.random() * 100).toString(),
      donorName: "Chris Evans <3",
      unitPrice: new Prisma.Decimal(Math.random() * 100),
      maxRequestLimit: "abc",
      visible: true,
      quantityPerUnit: 2,
      donorShippingNumber: "",
      hfhShippingNumber: "",
      allowAllocations: false,
      gik: false,
      ndc: "",
      notes: "",
      donorOfferItemId: null,
    });
  }

  dbMock.item.findMany.mockResolvedValue(items);
  return items;
}

// export async function fillDbMockWithUnallocatedItemRequestsForItemIdFiltering(
//   num: number
// ) {
//   // const numberOfItems = 10;
//   const numberOfPartners = 10;

//   const unallocatedItemRequests: UnallocatedItemRequest[] = [];

//   for (let i = 0; i < num; i++) {
//     unallocatedItemRequests.push({
//       id: i,
//       quantity: Math.floor(Math.random() * 1000),
//       partnerId: Math.floor(Math.random() * numberOfPartners),
//       itemId: 1,
//       comments: "Test unallocated item request " + i,
//     });
//   }
// }

// export async function fillDbMockWithUnallocatedItemRequestsForPartnerIdFilter(
//   num: number
// ) {
//   const partnerId = 1;
//   const numOfItems = 10;

//   const unallocatedItemRequests = [];
//   for (let i = 0; i < num; i++) {
//     unallocatedItemRequests.push({
//       id: i,
//       partnerId: partnerId,
//       itemId: Math.floor(Math.random() * numOfItems),
//       quantity: Math.floor(Math.random() * 100),
//       comments: `Test comment ${i}`,
//     });
//   }
//   dbMock.unallocatedItemRequest.findMany.mockResolvedValue(
//     unallocatedItemRequests
//   );
// }

/**
 * Helper method for creating a single unclaimed item.
 * Only the id and title are 100% untouchable by caller.
 */
export async function createItem({
  id = Math.floor(Math.random() * 10000),
  title = `Test Item ${id}`,
  type = "Test Type",
  category = ItemCategory.MEDICAL_SUPPLY,
  quantity = 10,
  expirationDate = new Date(Date.now() + Math.floor(Math.random() * 10000)),
  unitType = "Test Unit",
  datePosted = new Date(),
  palletNumber = Math.floor(Math.random() * 10000).toString(),
  lotNumber = Math.floor(Math.random() * 10000).toString(),
  boxNumber = Math.floor(Math.random() * 10000).toString(),
  donorName = "Test Donor",
  unitPrice = new Prisma.Decimal(1),
  maxRequestLimit = "1",
  visible = true,
  quantityPerUnit = 0,
  donorShippingNumber = "",
  hfhShippingNumber = "",
  allowAllocations = false,
  gik = false,
  ndc = "",
  notes = "",
  donorOfferItemId = null,
}: {
  id?: number;
  title?: string;
  type?: string;
  category?: ItemCategory;
  quantity?: number;
  expirationDate?: Date;
  unitSize?: number;
  unitType?: string;
  datePosted?: Date;
  palletNumber?: string;
  lotNumber?: string;
  boxNumber?: string;
  donorName?: string;
  unitPrice?: Prisma.Decimal;
  maxRequestLimit?: string;
  visible?: boolean;
  quantityPerUnit?: number;
  donorShippingNumber?: string;
  hfhShippingNumber?: string;
  allowAllocations?: boolean;
  gik?: boolean;
  ndc: string;
  notes: string;
  donorOfferItemId: number | null;
}): Promise<Item> {
  return {
    id,
    title,
    type,
    category,
    quantity,
    expirationDate,
    unitType,
    datePosted,
    lotNumber,
    palletNumber,
    boxNumber,
    donorName,
    unitPrice,
    maxRequestLimit,
    visible,
    quantityPerUnit,
    donorShippingNumber,
    hfhShippingNumber,
    allowAllocations,
    gik,
    ndc,
    notes,
    donorOfferItemId,
  };
}

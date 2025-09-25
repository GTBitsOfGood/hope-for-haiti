import { db } from "@/db";
import { CreateGeneralItemParams } from "@/types/api/generalItem.types";

export class GeneralItemService {
  static async createGeneralItem(item: CreateGeneralItemParams) {
    return await db.generalItem.create({
      data: item,
    });
  }

  static async getUnallocatedItems() {
    // A general item is unallocated if the sum of its allocated line items' quantities is less than its initial quantity
    const items = await db.$queryRaw`
      SELECT gi.*
      FROM "GeneralItem" gi
      INNER JOIN "LineItem" li
      ON gi.id = li."generalItemId"
      GROUP BY gi.id
      HAVING SUM(li.quantity) < gi."initialQuantity"
    `;

    return items;
  }
}

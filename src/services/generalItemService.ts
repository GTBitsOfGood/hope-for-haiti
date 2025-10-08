import { db } from "@/db";
import {
  CreateGeneralItemParams,
  UpdateGeneralItemParams,
} from "@/types/api/generalItem.types";
import { NotFoundError } from "@/util/errors";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export class GeneralItemService {
  static async createGeneralItem(item: CreateGeneralItemParams) {
    return await db.generalItem.create({
      data: item,
    });
  }

  static async updateGeneralItem(id: number, updates: UpdateGeneralItemParams) {
    try {
      return await db.generalItem.update({
        where: { id },
        data: updates,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("General item not found");
        }
      }
      throw error;
    }
  }

  static async deleteGeneralItem(id: number) {
    try {
      return await db.generalItem.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("General item not found");
        }
      }
      throw error;
    }
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

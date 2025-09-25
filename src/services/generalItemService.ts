import { db } from "@/db";
import { CreateGeneralItemParams } from "@/types/api/generalItem.types";

export class GeneralItemService {
  static async createGeneralItem(item: CreateGeneralItemParams) {
    return await db.generalItem.create({
      data: item,
    });
  }
}

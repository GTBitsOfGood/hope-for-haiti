import { db } from "@/db";
import { NotFoundError } from "@/util/errors";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { UpdateGeneralItemRequestData } from "@/types/api/generalItemRequest.types";

export class GeneralItemRequestService {
  static async updateRequest(data: UpdateGeneralItemRequestData) {
    try {
      const updatedRequest = await db.generalItemRequest.update({
        where: { id: data.id },
        data: {
          priority: data.priority,
          quantity: parseInt(data.quantity),
          comments: data.comments,
        },
      });

      return updatedRequest;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("Unallocated item request not found");
        }
      }
      throw error;
    }
  }
}

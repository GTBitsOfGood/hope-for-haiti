import { db } from "@/db";
import { NotFoundError } from "@/util/errors";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { UpdateGeneralItemRequestData } from "@/types/api/generalItemRequest.types";
import { Prisma } from "@prisma/client";

export class GeneralItemRequestService {
  static async getById(id: number) {
    const request = await db.generalItemRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundError("Unallocated item request not found");
    }

    return request;
  }

  static async getRequestsByGeneralItemId(generalItemId: number) {
    const requests = await db.generalItemRequest.findMany({
      where: { generalItemId },
      orderBy: { priority: "asc" },
    });

    return requests;
  }

  static async createRequest(
    data: Omit<
      Prisma.GeneralItemRequestCreateInput,
      "generalItem" | "partner"
    > & { generalItemId: number; partnerId: number }
  ) {
    const newRequest = await db.generalItemRequest.create({
      data: {
        generalItem: {
          connect: { id: data.generalItemId as number },
        },
        partner: { connect: { id: data.partnerId as number } },
        quantity: data.quantity,
        comments: data.comments,
        priority: data.priority,
      },
    });

    return newRequest;
  }

  static async updateRequest(id: number, data: Partial<UpdateGeneralItemRequestData>) {
    try {
      const updatedRequest = await db.generalItemRequest.update({
        where: { id },
        data
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

  static async deleteRequest(id: number) {
    try {
      await db.generalItemRequest.delete({
        where: { id },
      });
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

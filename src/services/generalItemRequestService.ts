import { db } from "@/db";
import { NotFoundError, ArgumentError } from "@/util/errors";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { UpdateGeneralItemRequestData } from "@/types/api/generalItemRequest.types";
import { Prisma } from "@prisma/client";
import {
  GeneralItemRequestsResponse,
} from "@/types/api/donorOffer.types";
import { Filters } from "@/types/api/filter.types";
import { buildQueryWithPagination, buildWhereFromFilters } from "@/util/table";
import { WishlistService } from "./wishlistService";
import { finalQuantityAfterPartnerEdit } from "@/util/requestQuantity";

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

  static async getRequestsByGeneralItemId(
    generalItemId: number,
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<GeneralItemRequestsResponse> {
    const filterWhere =
      buildWhereFromFilters<Prisma.GeneralItemRequestWhereInput>(
        Object.keys(Prisma.GeneralItemRequestScalarFieldEnum),
        filters
      );

    const where: Prisma.GeneralItemRequestWhereInput = {
      ...filterWhere,
      generalItemId,
      partner: {
        enabled: true,
        pending: false,
      },
    };

    const query = Prisma.validator<Prisma.GeneralItemRequestFindManyArgs>()({
      where,
      orderBy: { priority: "asc" },
      include: {
        generalItem: true,
        partner: {
          select: {
            name: true,
          },
        },
      },
    });

    buildQueryWithPagination(query, page, pageSize);

    const [requests, total] = await Promise.all([
      db.generalItemRequest.findMany(query),
      db.generalItemRequest.count({ where }),
    ]);

    type RequestWithRelations = Prisma.GeneralItemRequestGetPayload<typeof query>;

    return {
      requests: requests as RequestWithRelations[],
      total,
    };
  }

  static async createRequest(
    data: Omit<
      Prisma.GeneralItemRequestCreateInput,
      "generalItem" | "partner"
    > & { generalItemId: number; partnerId: number }
  ) {
    const partner = await db.user.findUnique({
      where: { id: data.partnerId },
      select: { enabled: true, pending: true, type: true },
    });

    if (!partner) {
      throw new NotFoundError("Partner not found");
    }

    if (!partner.enabled) {
      throw new ArgumentError("Cannot create request for deactivated partner");
    }

    if (partner.pending) {
      throw new ArgumentError("Cannot create request for pending partner");
    }
    
    const generalItem = await db.generalItem.findUnique({
      where: { id: data.generalItemId },
      include: {
        donorOffer: {
          select: { state: true, partnerResponseDeadline: true }
        },
        items: {
          where: {
            allocation: null
          },
          select: { id: true }
        }
      }
    });

    if (!generalItem) {
      throw new NotFoundError("General item not found");
    }

    if (generalItem.donorOffer?.state === "ARCHIVED") {
      if (generalItem.items.length === 0) {
        throw new ArgumentError("Cannot create requests for fully allocated archived items.");
      }
    }
    else if (generalItem.donorOffer?.state === "UNFINALIZED") {
      if (generalItem.donorOffer.partnerResponseDeadline) {
        const now = new Date();
        if (now > generalItem.donorOffer.partnerResponseDeadline) {
          throw new ArgumentError("Cannot create requests after the partner response deadline has passed.");
        }
      }
    }
    
    const newRequest = await db.generalItemRequest.create({
      data: {
        generalItem: {
          connect: { id: data.generalItemId as number },
        },
        partner: { connect: { id: data.partnerId as number } },
        quantity: data.quantity,
        comments: data.comments,
        priority: data.priority,
        finalQuantity: data.quantity,
      },
    });

    return newRequest;
  }

  static async updateRequest(id: number, data: Partial<UpdateGeneralItemRequestData>) {
    try {
      const request = await db.generalItemRequest.findUnique({
        where: { id },
        include: {
          generalItem: {
            include: {
              donorOffer: {
                select: { state: true, partnerResponseDeadline: true }
              },
              items: {
                where: {
                  allocation: null
                },
                select: { id: true }
              }
            }
          }
        }
      });

      if (!request) {
        throw new NotFoundError("Request not found");
      }

      if (request.generalItem?.donorOffer?.state === "ARCHIVED") {
        if (request.generalItem.items.length === 0) {
          throw new ArgumentError("Cannot update requests for fully allocated archived items.");
        }
      }
      else if (request.generalItem?.donorOffer?.state === "UNFINALIZED") {
        if (request.generalItem.donorOffer.partnerResponseDeadline) {
          const now = new Date();
          if (now > request.generalItem.donorOffer.partnerResponseDeadline) {
            throw new ArgumentError("Cannot update requests after the partner response deadline has passed.");
          }
        }
      }

      const updatedRequest = await db.$transaction(async (tx) => {
        // Lock the row, then read its current numbers. Overlapping saves (a
        // second click, another tab, or a staff revision) wait their turn, so
        // the decision below always uses the latest values.
        await tx.$queryRaw`SELECT id FROM "GeneralItemRequest" WHERE id = ${id} FOR UPDATE`;
        const current = await tx.generalItemRequest.findUniqueOrThrow({
          where: { id },
          select: { quantity: true, finalQuantity: true },
        });

        // Staff's revised number follows the partner's edit only while staff
        // haven't revised it. No wishlist entry here: the partner changed
        // their own ask, so nothing was refused.
        const finalQuantity = finalQuantityAfterPartnerEdit(current, data.quantity);
        return tx.generalItemRequest.update({
          where: { id },
          data: finalQuantity === undefined ? data : { ...data, finalQuantity },
        });
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

  static async updateWishlist(requestId: number, newFinalQuantity: number) {
    const { updated, newWishlistEntries } = await db.$transaction(async (tx) => {
      // Lock the request first, then read it. A concurrent save waits, so the
      // wishlist difference is always computed from the current value.
      await tx.$queryRaw`SELECT id FROM "GeneralItemRequest" WHERE id = ${requestId} FOR UPDATE`;
      const existingRequest = await tx.generalItemRequest.findUnique({
        where: { id: requestId },
        select: { finalQuantity: true, id: true },
      });

      if (!existingRequest) throw new NotFoundError("Request not found");

      const unfulfilledDelta = (existingRequest.finalQuantity ?? 0) - newFinalQuantity;

      const updated = await tx.generalItemRequest.update({
        where: { id: requestId },
        data: { finalQuantity: newFinalQuantity },
      });

      const newWishlistEntries =
        unfulfilledDelta !== 0
          ? await WishlistService.applyUnfulfilledWishlistDeltas(tx, [
              { requestId, unfulfilledQuantity: unfulfilledDelta },
            ])
          : [];

      return { updated, newWishlistEntries };
    });

    await WishlistService.indexNewWishlistEntries(newWishlistEntries);
    return updated;
  }

  static async bulkUpdateRequests(
    updates: Array<{ requestId: number; finalQuantity: number }>
  ) {
    const requestIds = updates.map(u => u.requestId);
    const requests = await db.generalItemRequest.findMany({
      where: { id: { in: requestIds } },
      include: {
        generalItem: {
          include: {
            donorOffer: {
              select: { state: true, partnerResponseDeadline: true }
            },
            items: {
              where: {
                allocation: null
              },
              select: { id: true }
            }
          }
        }
      }
    });

    const fullyAllocatedArchivedRequests = requests.filter(
      r => r.generalItem?.donorOffer?.state === "ARCHIVED" && 
           r.generalItem.items.length === 0
    );

    if (fullyAllocatedArchivedRequests.length > 0) {
      throw new ArgumentError("Cannot update requests for fully allocated archived items.");
    }

    const now = new Date();
    const expiredUnfinalizedRequests = requests.filter(
      r => r.generalItem?.donorOffer?.state === "UNFINALIZED" &&
           r.generalItem.donorOffer.partnerResponseDeadline && 
           now > r.generalItem.donorOffer.partnerResponseDeadline
    );

    if (expiredUnfinalizedRequests.length > 0) {
      throw new ArgumentError("Cannot update requests after the partner response deadline has passed.");
    }

    if (updates.length === 0) return [];

    const { results, newWishlistEntries } = await db.$transaction(async (tx) => {
      // Lock every request (in id order, so two bulk saves can't deadlock),
      // then read their current revised numbers. The wishlist differences are
      // computed from values nobody can change until this save commits.
      const lockIds = [...new Set(requestIds)].sort((a, b) => a - b);
      await tx.$queryRaw`SELECT id FROM "GeneralItemRequest" WHERE id IN (${Prisma.join(lockIds)}) ORDER BY id FOR UPDATE`;
      const current = await tx.generalItemRequest.findMany({
        where: { id: { in: lockIds } },
        select: { id: true, finalQuantity: true },
      });

      const wishlistDeltas = updates.flatMap((u) => {
        const existingRequest = current.find((r) => r.id === u.requestId);
        if (!existingRequest) return [];
        const delta = (existingRequest.finalQuantity ?? 0) - u.finalQuantity;
        return delta !== 0 ? [{ requestId: u.requestId, unfulfilledQuantity: delta }] : [];
      });

      const updateResults = await Promise.all(
        updates.map(({ requestId, finalQuantity }) =>
          tx.generalItemRequest.update({
            where: { id: requestId },
            data: { finalQuantity },
          })
        )
      );

      const newWishlistEntries = await WishlistService.applyUnfulfilledWishlistDeltas(
        tx,
        wishlistDeltas
      );

      return { results: updateResults, newWishlistEntries };
    });

    await WishlistService.indexNewWishlistEntries(newWishlistEntries);
    return results;
  }

  static async reassignRequest(
    requestId: number,
    targetGeneralItemId: number
  ) {
    return db.$transaction(async (tx) => {
      // Lock the moved request and, if the partner already has a request on
      // the target item, that one too (in id order, so two merges can't
      // deadlock). Both are read again below, inside the lock, so an edit
      // saved meanwhile is part of the merge instead of being overwritten.
      const moving = await tx.generalItemRequest.findUnique({
        where: { id: requestId },
        select: { partnerId: true },
      });
      if (!moving) {
        throw new NotFoundError("Request not found");
      }
      const target = await tx.generalItemRequest.findUnique({
        where: {
          generalItemId_partnerId: {
            generalItemId: targetGeneralItemId,
            partnerId: moving.partnerId,
          },
        },
        select: { id: true },
      });
      const lockIds = [...new Set([requestId, target?.id ?? requestId])].sort((a, b) => a - b);
      await tx.$queryRaw`SELECT id FROM "GeneralItemRequest" WHERE id IN (${Prisma.join(lockIds)}) ORDER BY id FOR UPDATE`;

      const existingRequest = await tx.generalItemRequest.findUnique({
        where: { id: requestId },
        include: {
          partner: {
            select: { id: true, name: true },
          },
          generalItem: {
            select: {
              id: true,
              donorOfferId: true,
            },
          },
        },
      });

      if (!existingRequest || !existingRequest.generalItem) {
        throw new NotFoundError("Request not found");
      }

      const previousGeneralItemId = existingRequest.generalItem.id;

      const targetGeneralItem = await tx.generalItem.findUnique({
        where: { id: targetGeneralItemId },
        select: {
          id: true,
          donorOfferId: true,
          title: true,
        },
      });

      if (!targetGeneralItem) {
        throw new NotFoundError("Target general item not found");
      }

      if (
        targetGeneralItem.donorOfferId !==
        existingRequest.generalItem.donorOfferId
      ) {
        throw new ArgumentError(
          "Target general item must belong to the same donor offer."
        );
      }

      const targetLineItemCount = await tx.lineItem.count({
        where: { generalItemId: targetGeneralItemId },
      });

      if (targetLineItemCount === 0) {
        throw new ArgumentError(
          "Target general item does not have any available line items."
        );
      }

      const duplicateRequest = await tx.generalItemRequest.findUnique({
        where: {
          generalItemId_partnerId: {generalItemId: targetGeneralItemId,
          partnerId: existingRequest.partnerId,}
        },
      });

      let updatedRequest;

      if (duplicateRequest) {
        const mergedQuantity =
          duplicateRequest.quantity + existingRequest.quantity;
        const mergedFinalQuantity =
          duplicateRequest.finalQuantity !== null &&
          existingRequest.finalQuantity !== null
            ? duplicateRequest.finalQuantity + existingRequest.finalQuantity
            : duplicateRequest.finalQuantity ?? existingRequest.finalQuantity;

        updatedRequest = await tx.generalItemRequest.update({
          where: { id: duplicateRequest.id },
          data: {
            quantity: mergedQuantity,
            finalQuantity: mergedFinalQuantity,
          },
        });

        await tx.generalItemRequest.delete({
          where: { id: requestId },
        });
      } else {
        updatedRequest = await tx.generalItemRequest.update({
          where: { id: requestId },
          data: { generalItemId: targetGeneralItemId },
        });
      }

      let deletedGeneralItemId: number | null = null;
      const remainingRequestCount = await tx.generalItemRequest.count({
        where: { generalItemId: previousGeneralItemId },
      });

      if (remainingRequestCount === 0) {
        const remainingLineItems = await tx.lineItem.count({
          where: { generalItemId: previousGeneralItemId },
        });

        if (remainingLineItems === 0) {
          await tx.generalItem.delete({ where: { id: previousGeneralItemId } });
          deletedGeneralItemId = previousGeneralItemId;
        }
      }

      const allocated = await tx.lineItem.aggregate({
        where: {
          generalItemId: targetGeneralItemId,
          allocation: {
            partnerId: existingRequest.partnerId,
          },
        },
        _sum: {
          quantity: true,
        },
      });

      return {
        request: {
          id: updatedRequest.id,
          generalItemId: updatedRequest.generalItemId,
          partnerId: updatedRequest.partnerId,
          quantity: updatedRequest.quantity,
          finalQuantity: updatedRequest.finalQuantity,
          partner: existingRequest.partner,
          itemsAllocated: allocated._sum.quantity ?? 0,
        },
        targetGeneralItem: {
          id: targetGeneralItem.id,
          title: targetGeneralItem.title,
        },
        previousGeneralItemId,
        deletedGeneralItemId,
      };
    });
  }

  static async deleteRequest(id: number) {
    try {
      const request = await db.generalItemRequest.findUnique({
        where: { id },
        include: {
          generalItem: {
            include: {
              donorOffer: {
                select: { state: true, partnerResponseDeadline: true }
              },
              items: {
                where: {
                  allocation: null
                },
                select: { id: true }
              }
            }
          }
        }
      });

      if (!request) {
        throw new NotFoundError("Request not found");
      }

      if (request.generalItem?.donorOffer?.state === "ARCHIVED") {
        if (request.generalItem.items.length === 0) {
          throw new ArgumentError("Cannot delete requests for fully allocated archived items.");
        }
      }
      else if (request.generalItem?.donorOffer?.state === "UNFINALIZED") {
        if (request.generalItem.donorOffer.partnerResponseDeadline) {
          const now = new Date();
          if (now > request.generalItem.donorOffer.partnerResponseDeadline) {
            throw new ArgumentError("Cannot delete requests after the partner response deadline has passed.");
          }
        }
      }

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

  static async getRequestsByPartnerId(
    partnerId: number,
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<GeneralItemRequestsResponse> {
    const partner = await db.user.findUnique({
      where: { id: partnerId },
      select: { enabled: true, pending: true },
    });

    if (!partner?.enabled || partner?.pending) {
      return { requests: [], total: 0 };
    }
    
    const filterWhere =
      buildWhereFromFilters<Prisma.GeneralItemRequestWhereInput>(
        Object.keys(Prisma.GeneralItemRequestScalarFieldEnum),
        filters
      );

    const where: Prisma.GeneralItemRequestWhereInput = {
      ...filterWhere,
      partnerId,
      generalItem: {
        donorOffer: {
          OR: [
            {
              archivedAt: null,
              state: "UNFINALIZED",
            },
            {
              archivedAt: { not: null },
              state: "ARCHIVED",
              items: {
                some: {
                  items: {
                    every: {
                      allocation: null
                    }
                  }
                }
              }
            }
          ]
        },
        
      },
    };

    const query = Prisma.validator<Prisma.GeneralItemRequestFindManyArgs>()({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        generalItem: {
          include: {
            donorOffer: {
              select: {
                id: true,
                offerName: true,
                donorName: true,
                state: true,
                archivedAt: true,
              },
            },
          },
        },
        partner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    buildQueryWithPagination(query, page, pageSize);

    const [requests, total] = await Promise.all([
      db.generalItemRequest.findMany(query),
      db.generalItemRequest.count({ where }),
    ]);

    type RequestWithRelations = Prisma.GeneralItemRequestGetPayload<typeof query>;

    return {
      requests: requests as RequestWithRelations[],
      total,
    };
  }
}
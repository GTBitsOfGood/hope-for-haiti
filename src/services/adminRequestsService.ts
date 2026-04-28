import { db } from "@/db";
import { DonorOfferState, Prisma } from "@prisma/client";
import { Filters } from "@/types/api/filter.types";
import {
  CurrentRequestGroup,
  CurrentRequestsResponse,
  PastRequestGroup,
  PastRequestItem,
  PastRequestsResponse,
} from "@/types/api/adminRequests.types";

const requestInclude = {
  partner: {
    select: {
      id: true,
      name: true,
    },
  },
  generalItem: {
    include: {
      donorOffer: {
        select: {
          state: true,
          archivedAt: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          allocation: {
            select: {
              partnerId: true,
              signOffId: true,
              signOff: {
                select: {
                  id: true,
                  date: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.GeneralItemRequestInclude;

type RequestWithRelations = Prisma.GeneralItemRequestGetPayload<{
  include: typeof requestInclude;
}>;

type ClassifiedRequest =
  | { bucket: "current"; signedOffQuantity: number }
  | {
      bucket: "past";
      signedOffQuantity: number;
      dateFulfilledOrDropped: Date;
    };

export default class AdminRequestsService {
  static async getCurrentRequests(
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<CurrentRequestsResponse> {
    const where = buildCurrentWhere(filters);

    const requests = await db.generalItemRequest.findMany({
      where,
      include: requestInclude,
    });

    const currentRequests = requests.filter(
      (request) => classifyRequest(request).bucket === "current"
    );

    const groupsMap = new Map<string, CurrentRequestGroup>();
    for (const request of currentRequests) {
      const key = makeGroupKey(request.createdAt, request.partnerId);
      let group = groupsMap.get(key);
      if (!group) {
        group = {
          date: request.createdAt,
          partner: {
            id: request.partner.id,
            name: request.partner.name,
          },
          items: [],
        };
        groupsMap.set(key, group);
      }
      group.items.push({
        requestId: request.id,
        title: request.generalItem.title,
        quantityRequested: request.quantity,
      });
    }

    const sortedGroups = Array.from(groupsMap.values()).sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    const total = sortedGroups.length;
    const paginated = paginate(sortedGroups, page, pageSize);

    return { data: paginated, total };
  }

  static async getPastRequests(
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<PastRequestsResponse> {
    const where = buildPartnerNameWhere(filters);

    const requests = await db.generalItemRequest.findMany({
      where,
      include: requestInclude,
    });

    type EnrichedPastRequest = {
      request: RequestWithRelations;
      signedOffQuantity: number;
      dateFulfilledOrDropped: Date;
    };

    const pastRequests: EnrichedPastRequest[] = [];
    for (const request of requests) {
      const classification = classifyRequest(request);
      if (classification.bucket !== "past") continue;
      pastRequests.push({
        request,
        signedOffQuantity: classification.signedOffQuantity,
        dateFulfilledOrDropped: classification.dateFulfilledOrDropped,
      });
    }

    const dateFiltered = applyDateFilter(
      pastRequests,
      (entry) => entry.dateFulfilledOrDropped,
      filters
    );

    const groupsMap = new Map<string, PastRequestGroup>();
    for (const entry of dateFiltered) {
      const { request, signedOffQuantity, dateFulfilledOrDropped } = entry;
      const key = makeGroupKey(dateFulfilledOrDropped, request.partnerId);
      let group = groupsMap.get(key);
      if (!group) {
        group = {
          date: dateFulfilledOrDropped,
          partner: {
            id: request.partner.id,
            name: request.partner.name,
          },
          items: [],
        };
        groupsMap.set(key, group);
      }
      const item: PastRequestItem = {
        requestId: request.id,
        title: request.generalItem.title,
        quantityRequested: request.quantity,
        quantityFulfilled: signedOffQuantity,
      };
      group.items.push(item);
    }

    const sortedGroups = Array.from(groupsMap.values()).sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    const total = sortedGroups.length;
    const paginated = paginate(sortedGroups, page, pageSize);

    return { data: paginated, total };
  }
}


function buildPartnerNameWhere(
  filters?: Filters
): Prisma.GeneralItemRequestWhereInput {
  const where: Prisma.GeneralItemRequestWhereInput = {};

  const partnerNameFilter = filters?.partnerName;
  if (partnerNameFilter?.type === "string" && partnerNameFilter.value) {
    where.partner = {
      name: {
        contains: partnerNameFilter.value,
        mode: "insensitive",
      },
    };
  }

  return where;
}

function buildCurrentWhere(
  filters?: Filters
): Prisma.GeneralItemRequestWhereInput {
  const where = buildPartnerNameWhere(filters);

  const dateFilter = filters?.date;
  if (dateFilter?.type === "date") {
    where.createdAt = {
      gte: new Date(dateFilter.gte),
      ...(dateFilter.lte ? { lte: new Date(dateFilter.lte) } : {}),
    };
  }

  return where;
}

function classifyRequest(request: RequestWithRelations): ClassifiedRequest {
  const signedOffQuantity = computeSignedOffQuantity(
    request.generalItem.items,
    request.partnerId
  );
  const donorOffer = request.generalItem.donorOffer;

  if (
    request.finalQuantity === 0 &&
    donorOffer.state !== DonorOfferState.UNFINALIZED
  ) {
    return {
      bucket: "past",
      signedOffQuantity,
      dateFulfilledOrDropped: donorOffer.archivedAt ?? request.createdAt,
    };
  }

  if (
    request.finalQuantity > 0 &&
    signedOffQuantity >= request.finalQuantity
  ) {
    const dateFulfilled = computeDateFulfilled(
      request.generalItem.items,
      request.partnerId,
      request.finalQuantity
    );
    return {
      bucket: "past",
      signedOffQuantity,
      dateFulfilledOrDropped: dateFulfilled ?? request.createdAt,
    };
  }

  if (
    donorOffer.state === DonorOfferState.ARCHIVED &&
    signedOffQuantity < request.finalQuantity
  ) {
    return {
      bucket: "past",
      signedOffQuantity,
      dateFulfilledOrDropped: donorOffer.archivedAt ?? request.createdAt,
    };
  }

  return { bucket: "current", signedOffQuantity };
}

function computeSignedOffQuantity(
  lineItems: Array<{
    quantity: number;
    allocation: {
      partnerId: number | null;
      signOffId: number | null;
    } | null;
  }>,
  partnerId: number
): number {
  let total = 0;

  for (const lineItem of lineItems) {
    const alloc = lineItem.allocation;
    if (
      alloc != null &&
      alloc.partnerId === partnerId &&
      alloc.signOffId != null
    ) {
      total += lineItem.quantity;
    }
  }

  return total;
}

function computeDateFulfilled(
  lineItems: Array<{
    quantity: number;
    allocation: {
      partnerId: number | null;
      signOff: { id: number; date: Date } | null;
    } | null;
  }>,
  partnerId: number,
  finalQuantity: number
): Date | null {
  const signedDeliveries: Array<{ date: Date; quantity: number }> = [];

  for (const lineItem of lineItems) {
    const alloc = lineItem.allocation;
    if (
      alloc != null &&
      alloc.partnerId === partnerId &&
      alloc.signOff != null
    ) {
      signedDeliveries.push({
        date: alloc.signOff.date,
        quantity: lineItem.quantity,
      });
    }
  }

  signedDeliveries.sort((a, b) => a.date.getTime() - b.date.getTime());

  let runningTotal = 0;
  for (const delivery of signedDeliveries) {
    runningTotal += delivery.quantity;
    if (runningTotal >= finalQuantity) {
      return delivery.date;
    }
  }

  return null;
}

function makeGroupKey(date: Date, partnerId: number): string {
  return `${date.toISOString().slice(0, 10)}|${partnerId}`;
}

function paginate<T>(items: T[], page?: number, pageSize?: number): T[] {
  if (!page || !pageSize) {
    return items;
  }
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function applyDateFilter<T>(
  items: T[],
  getDate: (item: T) => Date,
  filters?: Filters
): T[] {
  const dateFilter = filters?.date;
  if (!dateFilter || dateFilter.type !== "date") {
    return items;
  }

  const gte = new Date(dateFilter.gte);
  const lte = dateFilter.lte ? new Date(dateFilter.lte) : null;

  return items.filter((item) => {
    const date = getDate(item);
    if (date < gte) return false;
    if (lte && date > lte) return false;
    return true;
  });
}

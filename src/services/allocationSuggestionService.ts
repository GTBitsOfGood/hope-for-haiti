import { db } from "@/db";
import DonorOfferService from "@/services/donorOfferService";
import { AllocationSuggestionProgram } from "@/types/ui/allocationSuggestions";

type NormalizedItem = {
  id: number;
  lineItems: { lineItemId: number; quantity: number }[];
  requests: { partnerId: number; quantity: number }[];
  wishlistMatches: Map<number, Map<number, boolean>>;
};

export class AllocationSuggestionService {
  private static async buildWishlistMatches(
  generalItemId: number,
  lineItemIds: number[],
  partnerIds: number[]
): Promise<Map<number, Map<number, boolean>>> {
  const wishlistMatches = new Map<number, Map<number, boolean>>();

  if (!partnerIds.length) return wishlistMatches;

  const generalItem = await db.generalItem.findUnique({
    where: { id: generalItemId },
    select: { title: true },
  });

  if (!generalItem) return wishlistMatches;

  const wishlists = await db.wishlist.findMany({
    where: {
      partnerId: { in: partnerIds },
      generalItemId: null, // only unfulfilled/unlinked wishlists
      name: generalItem.title,
    },
    select: {
      partnerId: true,
    },
  });

  const partnersWithWishlist = new Set(wishlists.map((w) => w.partnerId));

  for (const lineItemId of lineItemIds) {
    const partnerMatches = new Map<number, boolean>();
    for (const partnerId of partnerIds) {
      partnerMatches.set(partnerId, partnersWithWishlist.has(partnerId));
    }
    wishlistMatches.set(lineItemId, partnerMatches);
  }

  return wishlistMatches;
}

  static async suggestForDonorOffer(
    donorOfferId: number
  ): Promise<AllocationSuggestionProgram[]> {
    const items = await this.fetchItemsForDonorOffer(donorOfferId);
    return this.buildProgramsForItems(items);
  }

  static async suggestForGeneralItems(
    generalItemIds: number[]
  ): Promise<AllocationSuggestionProgram[]> {
    const items = await this.fetchItemsForGeneralItems(generalItemIds);
    return this.buildProgramsForItems(items);
  }

  private static async buildProgramsForItems(
    items: NormalizedItem[]
  ): Promise<AllocationSuggestionProgram[]> {
    if (!items.length) {
      return [];
    }

    const programs: AllocationSuggestionProgram[] = [];
    for (const item of items) {
      const program = this.buildProgramForItem(item);
      if (program) {
        programs.push(program);
      }
    }

    return programs;
  }

  private static async fetchItemsForDonorOffer(
    donorOfferId: number
  ): Promise<NormalizedItem[]> {
    const { items } =
      await DonorOfferService.getAdminDonorOfferDetails(donorOfferId, true);

    // Type cast because we know requests will be included when we pass true
    const itemsWithRequests = items as (typeof items[number] & {
      requests: { id: number; quantity: number; partnerId: number }[];
    })[];

    if (!itemsWithRequests.length) {
      return [];
    }

    const generalItemIds = itemsWithRequests.map((item) => item.id);
    const lineItems = await db.lineItem.findMany({
      where: {
        generalItemId: { in: generalItemIds },
      },
      select: {
        id: true,
        generalItemId: true,
        quantity: true,
      },
    });

    const lineItemsByGeneralItemId = new Map<
      number,
      { lineItemId: number; quantity: number }[]
    >();

    for (const lineItem of lineItems) {
      if (
        !lineItem.generalItemId ||
        lineItem.quantity <= 0
      ) {
        continue;
      }

      const list =
        lineItemsByGeneralItemId.get(lineItem.generalItemId) ?? [];
      list.push({
        lineItemId: lineItem.id,
        quantity: lineItem.quantity,
      });
      lineItemsByGeneralItemId.set(lineItem.generalItemId, list);
    }

    return Promise.all(
      itemsWithRequests.map(async (item) => {
        const lineItemsForItem =
          lineItemsByGeneralItemId.get(item.id) ?? [];
        if (!lineItemsForItem.length) {
          return null;
        }

        const requests = (item.requests ?? [])
          .filter((request) => request.quantity > 0)
          .map((request) => ({
            partnerId: request.partnerId,
            quantity: request.quantity,
          }));

        if (!requests.length) {
          return null;
        }

        const lineItemIds = lineItemsForItem.map((li) => li.lineItemId);
        const partnerIds = requests.map((r) => r.partnerId);
        const wishlistMatches = await this.buildWishlistMatches(
          item.id,
          lineItemIds,
          partnerIds
        );

        return {
          id: item.id,
          lineItems: lineItemsForItem,
          requests,
          wishlistMatches,
        };
      })
    ).then((items) => items.filter((item) => item !== null) as NormalizedItem[]);
  }

  private static async fetchItemsForGeneralItems(
    generalItemIds: number[]
  ): Promise<NormalizedItem[]> {
    if (!generalItemIds.length) {
      return [];
    }

    const generalItems = await db.generalItem.findMany({
      where: { id: { in: generalItemIds } },
      include: {
        requests: {
          select: {
            partnerId: true,
            quantity: true,
          },
        },
        items: {
          where: {
            allocation: null,
          },
          select: {
            id: true,
            quantity: true,
          },
        },
      },
    });

    return Promise.all(
      generalItems.map(async (item) => {
        if (!item.items.length) {
          return null;
        }

        const requests = item.requests
          .filter((request) => request.quantity > 0)
          .map((request) => ({
            partnerId: request.partnerId,
            quantity: request.quantity,
          }));

        if (!requests.length) {
          return null;
        }

        const lineItems = item.items.map((lineItem) => ({
          lineItemId: lineItem.id,
          quantity: lineItem.quantity,
        }));

        const lineItemIds = lineItems.map((li) => li.lineItemId);
        const partnerIds = requests.map((r) => r.partnerId);
        const wishlistMatches = await this.buildWishlistMatches(
          item.id,
          lineItemIds,
          partnerIds
        );

        return {
          id: item.id,
          lineItems,
          requests,
          wishlistMatches,
        };
      })
    ).then((items) => items.filter((item) => item !== null) as NormalizedItem[]);
  }

  private static buildLinearProgram(
    lineItems: { lineItemId: number; quantity: number }[],
    targets: { partnerId: number; target: number }[],
    wishlistMatches: Map<number, Map<number, boolean>>
  ): string {
    const itemCount = lineItems.length;
    const partnerCount = targets.length;
    const WISHLIST_WEIGHT = 0.001;

    const variableX = (iIdx: number, pIdx: number) => `x_i${iIdx}_p${pIdx}`;
    const variableW = (iIdx: number, pIdx: number) => `w_i${iIdx}_p${pIdx}`;
    const variableDevPos = (pIdx: number) => `dpos_p${pIdx}`;
    const variableDevNeg = (pIdx: number) => `dneg_p${pIdx}`;

    const lines: string[] = [];

    lines.push("Minimize");
    lines.push(" obj:");
    const objectiveTerms: string[] = [];
    for (let p = 0; p < partnerCount; p++) {
      objectiveTerms.push(variableDevPos(p));
      objectiveTerms.push(variableDevNeg(p));
    }

    // wishlist incentive terms (negative, so subtract from objective to incentivize)
    const negativeTerms: string[] = [];
    for (let i = 0; i < itemCount; i++) {
      const lineItemId = lineItems[i].lineItemId;
      const matches = wishlistMatches.get(lineItemId);
      for (let p = 0; p < partnerCount; p++) {
        const targetPartnerId = targets[p].partnerId;
        if (matches?.get(targetPartnerId)) {
          negativeTerms.push(`- ${WISHLIST_WEIGHT} ${variableW(i, p)}`);
        }
      }
    }

    const allTerms = objectiveTerms.join(" + ");
    const finalObjective = allTerms + (negativeTerms.length > 0 ? " " + negativeTerms.join(" ") : "");
    lines.push("    " + finalObjective);

    lines.push("Subject To");
    for (let itemIdx = 0; itemIdx < itemCount; itemIdx++) {
      const terms: string[] = [];
      for (let partnerIdx = 0; partnerIdx < partnerCount; partnerIdx++) {
        terms.push(variableX(itemIdx, partnerIdx));
      }
      lines.push(` assign_i${itemIdx}: ` + terms.join(" + ") + " = 1");
    }

    for (let partnerIdx = 0; partnerIdx < partnerCount; partnerIdx++) {
      const t = targets[partnerIdx];
      const terms: string[] = [];
      for (let itemIdx = 0; itemIdx < itemCount; itemIdx++) {
        const q = lineItems[itemIdx].quantity;
        terms.push(`${q} ${variableX(itemIdx, partnerIdx)}`);
      }
      terms.push(`- ${variableDevPos(partnerIdx)}`);
      terms.push(`+ ${variableDevNeg(partnerIdx)}`);
      lines.push(` balance_p${partnerIdx}: ` + terms.join(" ") + ` = ${t.target}`);
    }

    // Link wishlist indicator variables to allocation variables
    // w_i_p can only be 1 if x_i_p is 1
    for (let i = 0; i < itemCount; i++) {
      const lineItemId = lineItems[i].lineItemId;
      const matches = wishlistMatches.get(lineItemId);
      for (let p = 0; p < partnerCount; p++) {
        const targetPartnerId = targets[p].partnerId;
        if (matches?.get(targetPartnerId)) {
          lines.push(` wishlist_link_i${i}_p${p}: ${variableW(i, p)} - ${variableX(i, p)} <= 0`);
        }
      }
    }

    lines.push("Bounds");
    for (let partnerIdx = 0; partnerIdx < partnerCount; partnerIdx++) {
      lines.push(` 0 <= ${variableDevPos(partnerIdx)}`);
      lines.push(` 0 <= ${variableDevNeg(partnerIdx)}`);
    }

    lines.push("Binaries");
    const binaries: string[] = [];
    for (let itemIdx = 0; itemIdx < itemCount; itemIdx++) {
      for (let partnerIdx = 0; partnerIdx < partnerCount; partnerIdx++) {
        binaries.push(variableX(itemIdx, partnerIdx));

        // wishlist indicator variables for wishlist matches
        const lineItemId = lineItems[itemIdx].lineItemId;
        const matches = wishlistMatches.get(lineItemId);
        const targetPartnerId = targets[partnerIdx].partnerId;
        if (matches?.get(targetPartnerId)) {
          binaries.push(variableW(itemIdx, partnerIdx));
        }
      }
    }
    lines.push(" " + binaries.join("\n "));

    lines.push("End");

    return lines.join("\n");
  }

  private static buildProgramForItem(
    item: NormalizedItem
  ): AllocationSuggestionProgram | null {
    const usableLineItems = item.lineItems.filter(
      (lineItem) => lineItem.quantity > 0
    );
    const requests = item.requests.filter((request) => request.quantity > 0);

    if (!usableLineItems.length || !requests.length) {
      return null;
    }

    const totalQuantity = usableLineItems.reduce(
      (sum, entry) => sum + entry.quantity,
      0
    );

    if (totalQuantity <= 0) {
      return null;
    }

    const totalRequested = requests.reduce(
      (sum, request) => sum + Math.max(0, request.quantity),
      0
    );

    const targets = requests.map((request) => ({
      partnerId: request.partnerId,
      target:
        totalRequested > 0
          ? (Math.max(0, request.quantity) / totalRequested) * totalQuantity
          : 0,
    }));

    if (!targets.length) {
      return null;
    }

    const lp = this.buildLinearProgram(usableLineItems, targets, item.wishlistMatches);

    return {
      itemId: item.id,
      lp,
      lineItems: usableLineItems.map((lineItem) => ({
        lineItemId: lineItem.lineItemId,
        quantity: lineItem.quantity,
      })),
      partners: targets.map((target) => ({
        partnerId: target.partnerId,
        target: target.target,
      })),
    };
  }
}

export default AllocationSuggestionService;

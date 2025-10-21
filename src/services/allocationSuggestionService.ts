import { db } from "@/db";
import DonorOfferService from "@/services/donorOfferService";
import { InternalError } from "@/util/errors";
import highsLoader from "highs";
import path from "path";

type AllocationResult = { lineItemId: number; partnerId: number };

type NormalizedItem = {
  id: number;
  lineItems: { lineItemId: number; quantity: number }[];
  requests: { partnerId: number; quantity: number }[];
};

export class AllocationSuggestionService {
  static async suggestForDonorOffer(
    donorOfferId: number
  ): Promise<AllocationResult[]> {
    const items = await this.fetchItemsForDonorOffer(donorOfferId);
    return this.solveForItems(items);
  }

  static async suggestForGeneralItems(
    generalItemIds: number[]
  ): Promise<AllocationResult[]> {
    const items = await this.fetchItemsForGeneralItems(generalItemIds);
    return this.solveForItems(items);
  }

  private static async solveForItems(
    items: NormalizedItem[]
  ): Promise<AllocationResult[]> {
    if (!items.length) {
      return [];
    }

    const highs = await highsLoader({
      locateFile: (file) =>
        path.join(process.cwd(), "node_modules/highs/build", file),
    });

    const allocations: AllocationResult[] = [];
    for (const item of items) {
      const solved = await this.solveAllocationsForItem(highs, item);
      allocations.push(...solved);
    }

    return allocations;
  }

  private static async fetchItemsForDonorOffer(
    donorOfferId: number
  ): Promise<NormalizedItem[]> {
    const { itemsWithRequests } =
      await DonorOfferService.getAdminDonorOfferDetails(donorOfferId);

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

    return itemsWithRequests.reduce<NormalizedItem[]>((acc, item) => {
      const lineItemsForItem =
        lineItemsByGeneralItemId.get(item.id) ?? [];
      if (!lineItemsForItem.length) {
        return acc;
      }

      const requests = item.requests
        .filter((request) => request.quantity > 0)
        .map((request) => ({
          partnerId: request.partnerId,
          quantity: request.quantity,
        }));

      if (!requests.length) {
        return acc;
      }

      acc.push({
        id: item.id,
        lineItems: lineItemsForItem,
        requests,
      });

      return acc;
    }, []);
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

    console.log(generalItems);

    return generalItems.reduce<NormalizedItem[]>((acc, item) => {
      if (!item.items.length) {
        return acc;
      }

      const requests = item.requests
        .filter((request) => request.quantity > 0)
        .map((request) => ({
          partnerId: request.partnerId,
          quantity: request.quantity,
        }));

      if (!requests.length) {
        return acc;
      }

      acc.push({
        id: item.id,
        lineItems: item.items.map((lineItem) => ({
          lineItemId: lineItem.id,
          quantity: lineItem.quantity,
        })),
        requests,
      });

      return acc;
    }, []);
  }

  private static buildLinearProgram(
    lineItems: { lineItemId: number; quantity: number }[],
    targets: { partnerId: number; target: number }[]
  ): string {
    const itemCount = lineItems.length;
    const partnerCount = targets.length;

    const variableX = (iIdx: number, pIdx: number) => `x_i${iIdx}_p${pIdx}`;
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
    lines.push("    " + objectiveTerms.join(" + "));

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
      }
    }
    lines.push(" " + binaries.join("\n "));

    lines.push("End");

    return lines.join("\n");
  }

  private static async solveAllocationsForItem(
    highs: Awaited<ReturnType<typeof highsLoader>>,
    item: NormalizedItem
  ): Promise<AllocationResult[]> {
    const lineItems = item.lineItems;
    const requests = item.requests;

    if (!lineItems.length || !requests.length) {
      return [];
    }

    const totalQuantity = lineItems.reduce(
      (sum, entry) => sum + entry.quantity,
      0
    );
    if (totalQuantity <= 0) {
      return [];
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
      return [];
    }

    const lp = this.buildLinearProgram(lineItems, targets);

    const solution = highs.solve(lp, {
      presolve: "on",
      threads: 0,
      time_limit: 10,
    });

    if (!solution || solution.Status !== "Optimal") {
      throw new InternalError("Unable to solve problem optimally");
    }

    const columns = solution.Columns as Record<string, { Primal: number }>;
    const allocations: AllocationResult[] = [];

    const partnerCount = targets.length;
    const itemCount = lineItems.length;

    const variableX = (iIdx: number, pIdx: number) => `x_i${iIdx}_p${pIdx}`;

    for (let itemIdx = 0; itemIdx < itemCount; itemIdx++) {
      let chosenPartnerIdx: number | null = null;
      for (let partnerIdx = 0; partnerIdx < partnerCount; partnerIdx++) {
        const varName = variableX(itemIdx, partnerIdx);
        const value = columns[varName]?.Primal ?? 0;
        if (value > 0.5) {
          chosenPartnerIdx = partnerIdx;
          break;
        }
      }

      if (chosenPartnerIdx === null) {
        let maxVal = -Infinity;
        let maxIdx = 0;
        for (let partnerIdx = 0; partnerIdx < partnerCount; partnerIdx++) {
          const varName = variableX(itemIdx, partnerIdx);
          const value = columns[varName]?.Primal ?? 0;
          if (value > maxVal) {
            maxVal = value;
            maxIdx = partnerIdx;
          }
        }
        chosenPartnerIdx = maxIdx;
      }

      const partnerId = targets[chosenPartnerIdx].partnerId;
      const lineItemId = lineItems[itemIdx].lineItemId;
      allocations.push({ lineItemId, partnerId });
    }

    return allocations;
  }
}

export default AllocationSuggestionService;

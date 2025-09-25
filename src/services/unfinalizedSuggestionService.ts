import { getOpenAIClient } from "@/lib/azureOpenAI";

export type PartnerRequest = {
  partnerId: number;
  quantity: number; // requested quantity from partner for this item
};

export type GeneralItemInput = {
  title: string;
  type: string;
  description: string;
  expirationDate: string; // ISO
  unitType: string;
  quantityPerUnit: number;
  totalQuantity: number; // available to allocate
  requests: PartnerRequest[];
};

export type AllocationSuggestionBasic = {
  items: { requests: { partnerId: number; quantity: number }[] }[];
};

export type AllocationSuggestionDetailed = {
  items: {
    before: { requests: { partnerId: number; quantity: number }[] };
    after: { requests: { partnerId: number; quantity: number }[] };
  }[];
};

function largestRemainderIntegerAllocation(targetTotal: number, weights: number[], minPerIndex: number[] = []): number[] {
  // Allocate integers summing to targetTotal proportional to weights using largest remainder method.
  const n = weights.length;
  if (n === 0) return [];
  const mins = minPerIndex.length === n ? minPerIndex.slice() : Array(n).fill(0);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (targetTotal <= 0) return Array(n).fill(0);

  let baseShares: number[];
  let remainders: number[];

  if (totalWeight === 0) {
    const even = targetTotal / n;
    baseShares = Array.from({ length: n }, () => Math.floor(even));
    remainders = Array.from({ length: n }, () => even - Math.floor(even));
  } else {
    const raw = weights.map((w) => (w / totalWeight) * targetTotal);
    baseShares = raw.map((x) => Math.floor(x));
    remainders = raw.map((x, i) => x - baseShares[i]);
  }

  // Enforce minimums
  for (let i = 0; i < n; i++) {
    if (baseShares[i] < mins[i]) baseShares[i] = mins[i];
  }

  const allocated = baseShares.reduce((a, b) => a + b, 0);
  let remaining = targetTotal - allocated;

  // Distribute remaining by largest remainders (and then by higher weight)
  const indices = [...Array(n).keys()];
  indices.sort((i, j) => {
    if (remainders[j] !== remainders[i]) return remainders[j] - remainders[i];
    return weights[j] - weights[i];
  });
  let idx = 0;
  while (remaining > 0 && n > 0) {
    const i = indices[idx % n];
    baseShares[i] += 1;
    remaining -= 1;
    idx += 1;
  }

  // If we overshot (due to enforcing mins), trim from lowest remainder/weight
  if (remaining < 0) {
    const indices2 = [...Array(n).keys()];
    indices2.sort((i, j) => {
      if (remainders[i] !== remainders[j]) return remainders[i] - remainders[j];
      return weights[i] - weights[j];
    });
    let k = 0;
    while (remaining < 0 && n > 0) {
      const i = indices2[k % n];
      if (baseShares[i] > mins[i]) {
        baseShares[i] -= 1;
        remaining += 1;
      }
      k += 1;
    }
  }

  // Final clamp non-negative
  for (let i = 0; i < n; i++) baseShares[i] = Math.max(0, Math.floor(baseShares[i]));
  return baseShares;
}

function normalizeRequestsToAvailable(totalQuantity: number, requests: PartnerRequest[]): number[] {
  const sumRequested = requests.reduce((a, r) => a + (r.quantity || 0), 0);
  const weights = requests.map((r) => (sumRequested > 0 ? r.quantity / sumRequested : 0));
  // Use largest remainder on proportional weights to allocate integers summing to totalQuantity
  return largestRemainderIntegerAllocation(totalQuantity, weights);
}

export class UnfinalizedSuggestionService {
  static async suggestAllocations(
    generalItems: GeneralItemInput[],
    options?: { includeDetails?: boolean }
  ): Promise<AllocationSuggestionBasic | AllocationSuggestionDetailed> {
    // Precompute normalized allocations and partner context across all items
    const normalizedPerItem = generalItems.map((item) => {
      const shares = normalizeRequestsToAvailable(item.totalQuantity, item.requests);
      return shares; // array aligned with item.requests
    });

    const partnerGlobal = new Map<number, { totalNormalized: number; requestCount: number }>();
    generalItems.forEach((item, itemIdx) => {
      item.requests.forEach((req, rIdx) => {
        const norm = normalizedPerItem[itemIdx][rIdx] || 0;
        const p = partnerGlobal.get(req.partnerId) || { totalNormalized: 0, requestCount: 0 };
        p.totalNormalized += norm;
        p.requestCount += 1;
        partnerGlobal.set(req.partnerId, p);
      });
    });

    const { client } = getOpenAIClient();

    // Fallback: if no LLM, return normalized allocations respecting totals
    if (!client) {
      if (options?.includeDetails) {
        return {
          items: generalItems.map((item, idx) => {
            const before = item.requests.map((r, j) => ({ partnerId: r.partnerId, quantity: normalizedPerItem[idx][j] || 0 }));
            return { before: { requests: before }, after: { requests: before } };
          }),
        } satisfies AllocationSuggestionDetailed;
      }
      // Basic shape
      return {
        items: generalItems.map((item, idx) => ({
          requests: item.requests.map((r, j) => ({ partnerId: r.partnerId, quantity: normalizedPerItem[idx][j] || 0 })),
        })),
      } satisfies AllocationSuggestionBasic;
    }

    // Build prompt with heuristics
    const system = `You are a fair allocation assistant helping distribute limited humanitarian supplies among partners.
Always output integers and ensure for each item the sum of allocated quantities equals the item's totalQuantity exactly.
Constraints:
- No negatives. Do not exceed each item's totalQuantity.
- Keep partner IDs unchanged; return the same partners per item in the same order.
- If possible, give every requesting partner at least a token amount (e.g., 1).
Heuristics to guide adjustments (apply gently):
1) Partner Type Priority: internal programs and higher-tier partners may receive more than smaller external partners when demand exceeds supply.
2) Alignment: Requests should align with population served; extremely disproportionate requests should be scaled down.
3) Declared Priority: Higher priority (High > Medium > Low) merits a moderate boost.
4) Equity in current offer: Partners already receiving many allocations across these items can be trimmed in favor of those receiving less.
5) Breadth vs monopoly: Don't let partners requesting many items monopolize; those with few requests should have a chance to receive at least one.
6) Critical gaps: If a partner is getting reduced elsewhere, consider modest boosts here.
7) Recent history: If a partner received little recently, boost modestly (if info is provided; otherwise skip).
If a specific heuristic lacks data, ignore it. Maintain transparency and fairness.`;

    // Prepare compact input payload for the model
    const modelInput = {
      items: generalItems.map((item, idx) => ({
        index: idx,
        title: item.title,
        type: item.type,
        totalQuantity: item.totalQuantity,
        requests: item.requests.map((r, j) => ({
          partnerId: r.partnerId,
          originalRequest: r.quantity,
          normalizedSuggested: normalizedPerItem[idx][j] || 0,
          partnerContext: partnerGlobal.get(r.partnerId) || { totalNormalized: 0, requestCount: 0 },
        })),
      })),
    };

    const user = `Adjust the normalizedSuggested quantities when needed to better follow the heuristics.
For each item, return allocations as integers whose sum equals totalQuantity exactly.
Use partnerContext across all items when making tradeoffs. Keep partner order and IDs unchanged.`;

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "omni-moderate",
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify({ instruction: user, data: modelInput }) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "allocation_schema",
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    requests: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          partnerId: { type: "number" },
                          quantity: { type: "number" },
                        },
                        required: ["partnerId", "quantity"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["requests"],
                  additionalProperties: false,
                },
              },
            },
            required: ["items"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    // Parse and post-process
    // The model returns a simpler shape: { items: [{ requests: [...] }, ...] }
  type ModelResponse = { items: { requests: { partnerId: number; quantity: number }[] }[] } | null;
    let parsedModel: ModelResponse = null;
    try {
      const content = response.choices?.[0]?.message?.content || "";
      const obj = JSON.parse(content);
      if (obj && Array.isArray(obj.items)) parsedModel = obj as ModelResponse;
    } catch {
      parsedModel = null;
    }

    // Build final from model or fallback normalized
    if (options?.includeDetails) {
      const detailed: AllocationSuggestionDetailed = { items: [] };
      for (let i = 0; i < generalItems.length; i++) {
        const item = generalItems[i];
        const requested = item.requests;
        const beforeRequests = requested.map((r, j) => ({ partnerId: r.partnerId, quantity: normalizedPerItem[i][j] || 0 }));
        const modelReqs = parsedModel?.items?.[i]?.requests || [];
        const byId = new Map<number, number>();
        for (const r of modelReqs) {
          if (typeof r?.partnerId === "number" && typeof r?.quantity === "number") {
            byId.set(r.partnerId, r.quantity);
          }
        }

        const raw = requested.map((r, j) => {
          const val = byId.has(r.partnerId) ? (byId.get(r.partnerId) as number) : normalizedPerItem[i][j] || 0;
          return Number.isFinite(val) ? val : 0;
        });
        let ints = raw.map((v) => Math.max(0, Math.round(v)));
        const sum = ints.reduce((a, b) => a + b, 0);
        if (sum !== item.totalQuantity) {
          const weights = raw.map((v) => Math.max(0, v));
          ints = largestRemainderIntegerAllocation(item.totalQuantity, weights);
        }
        detailed.items.push({
          before: { requests: beforeRequests },
          after: { requests: requested.map((r, j) => ({ partnerId: r.partnerId, quantity: ints[j] || 0 })) },
        });
      }
      return detailed;
    }

    // Basic shape only
    const basic: AllocationSuggestionBasic = { items: [] };
    for (let i = 0; i < generalItems.length; i++) {
      const item = generalItems[i];
      const requested = item.requests;
      const modelReqs = parsedModel?.items?.[i]?.requests || [];
      const byId = new Map<number, number>();
      for (const r of modelReqs) {
        if (typeof r?.partnerId === "number" && typeof r?.quantity === "number") {
          byId.set(r.partnerId, r.quantity);
        }
      }

      // Start from model quantities if present, else from normalized suggestion
      const raw = requested.map((r, j) => {
        const val = byId.has(r.partnerId) ? (byId.get(r.partnerId) as number) : normalizedPerItem[i][j] || 0;
        return Number.isFinite(val) ? val : 0;
      });

      // Enforce integers and non-negatives
  let ints = raw.map((v) => Math.max(0, Math.round(v)));

      // Ensure sum equals totalQuantity exactly via adjustment
      const sum = ints.reduce((a, b) => a + b, 0);
      if (sum !== item.totalQuantity) {
        // Use largest remainder around the existing raw values as weights to correct total
        const weights = raw.map((v) => Math.max(0, v));
        ints = largestRemainderIntegerAllocation(item.totalQuantity, weights);
      }

      basic.items.push({
        requests: requested.map((r, j) => ({ partnerId: r.partnerId, quantity: ints[j] || 0 })),
      });
    }
    return basic;
  }
}

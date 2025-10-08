import { getOpenAIClient } from "@/lib/azureOpenAI";

export type PartnerRequest = {
  partnerId: number;
  quantity: number;
};

export type GeneralItemInput = {
  title: string;
  type: string;
  description: string;
  expirationDate: string;
  unitType: string;
  quantityPerUnit: number;
  totalQuantity: number;
  requests: PartnerRequest[];
};

export type AllocationSuggestion = {
  items: { requests: { partnerId: number; quantity: number }[] }[];
};


type PartnerTotals = {
  normalizedTotal: number;
  requestedTotal: number;
  requestCount: number;
};

type ModelRequestPayload = {
  items: {
    index: number;
    title: string;
    type: string;
    description: string;
    expirationDate: string;
    unitType: string;
    quantityPerUnit: number;
    totalQuantity: number;
    requests: {
      partnerId: number;
      originalRequest: number;
      normalizedSuggestion: number;
      partnerTotals: PartnerTotals;
    }[];
  }[];
};

type ModelResponse = {
  items: { requests: { partnerId: number; quantity: number }[] }[];
};

const SYSTEM_PROMPT = `You are assisting Hope for Haiti staff with distributing limited items across partner requests.
Return allocations that:
- keep partner IDs and ordering unchanged;
- contain only non-negative integers;
- sum to each item's totalQuantity exactly;
- prefer fair, explainable adjustments applying these heuristics when data allows:
  • Partner type priority (internal programs and higher-tier partners get preference when supply is short)
  • Population alignment (very outsized requests should be trimmed)
  • Partner-declared urgency (High > Medium > Low)
  • Equity within the current offer (partners already receiving many items can be scaled down)
  • Breadth vs. monopoly (partners with fewer requests should have a chance to receive something)
  • Critical gaps (partners reduced elsewhere can be modestly boosted)
  • Recent history (partners missing out recently can be boosted if indicated)
  • Minimum allocation rule (try to give every requesting partner at least one unit when inventory allows)
If information is missing for a heuristic, fall back to the normalizedSuggestion.`;

function distributeIntegers(total: number, weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  if (total <= 0) return Array(n).fill(0);

  const safeWeights = weights.map((value) => (Number.isFinite(value) && value > 0 ? value : 0));
  const weightSum = safeWeights.reduce((sum, value) => sum + value, 0);
  const baseline = weightSum > 0 ? safeWeights : Array(n).fill(1);
  const baselineSum = weightSum > 0 ? weightSum : n;

  const rawShares = baseline.map((value) => (value / baselineSum) * total);
  const allocation = rawShares.map((value) => Math.floor(value));
  let remainder = total - allocation.reduce((sum, value) => sum + value, 0);

  if (remainder === 0) return allocation;

  const order = rawShares
    .map((value, index) => ({
      index,
      fraction: value - Math.floor(value),
      weight: baseline[index],
    }))
    .sort((a, b) => {
      if (b.fraction !== a.fraction) return b.fraction - a.fraction;
      return b.weight - a.weight;
    });

  let cursor = 0;
  while (remainder > 0) {
    const target = order[cursor % n]?.index ?? 0;
    allocation[target] += 1;
    remainder -= 1;
    cursor += 1;
  }

  return allocation;
}

function normalizeRequests(item: GeneralItemInput): number[] {
  const weights = item.requests.map((request) => Math.max(0, request.quantity));
  return distributeIntegers(item.totalQuantity, weights);
}

function collectPartnerTotals(items: GeneralItemInput[], normalized: number[][]): Map<number, PartnerTotals> {
  const totals = new Map<number, PartnerTotals>();

  items.forEach((item, itemIndex) => {
    item.requests.forEach((request, requestIndex) => {
      const current = totals.get(request.partnerId) ?? {
        normalizedTotal: 0,
        requestedTotal: 0,
        requestCount: 0,
      };
      current.normalizedTotal += normalized[itemIndex][requestIndex] ?? 0;
      current.requestedTotal += Math.max(0, request.quantity);
      current.requestCount += 1;
      totals.set(request.partnerId, current);
    });
  });

  return totals;
}

function buildModelPayload(items: GeneralItemInput[], normalized: number[][], partnerTotals: Map<number, PartnerTotals>): ModelRequestPayload {
  return {
    items: items.map((item, index) => ({
      index,
      title: item.title,
      type: item.type,
      description: item.description,
      expirationDate: item.expirationDate,
      unitType: item.unitType,
      quantityPerUnit: item.quantityPerUnit,
      totalQuantity: item.totalQuantity,
      requests: item.requests.map((request, requestIndex) => ({
        partnerId: request.partnerId,
        originalRequest: request.quantity,
        normalizedSuggestion: normalized[index][requestIndex] ?? 0,
        partnerTotals: partnerTotals.get(request.partnerId) ?? {
          normalizedTotal: 0,
          requestedTotal: 0,
          requestCount: 0,
        },
      })),
    })),
  };
}

function parseModelResponse(content: string | undefined): ModelResponse | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.items)) return parsed as ModelResponse;
  } catch {
    return null;
  }
  return null;
}

function sanitizeAllocations(
  item: GeneralItemInput,
  normalized: number[],
  candidate: { partnerId: number; quantity: number }[] | undefined
): { partnerId: number; quantity: number }[] {
  const candidateMap = new Map<number, number>();
  candidate?.forEach((entry) => {
    if (typeof entry?.partnerId === "number" && Number.isFinite(entry?.quantity)) {
      candidateMap.set(entry.partnerId, Math.max(0, entry.quantity));
    }
  });

  const raw = item.requests.map((request, index) => {
    const candidateValue = candidateMap.get(request.partnerId);
    if (typeof candidateValue === "number") return candidateValue;
    return normalized[index] ?? 0;
  });

  const weights = raw.some((value) => value > 0) ? raw : normalized;
  const finalQuantities = distributeIntegers(item.totalQuantity, weights);

  return item.requests.map((request, index) => ({
    partnerId: request.partnerId,
    quantity: finalQuantities[index] ?? 0,
  }));
}


function buildBasicResult(adjusted: { partnerId: number; quantity: number }[][]): AllocationSuggestion {
  return {
    items: adjusted.map((requests) => ({ requests })),
  };
}

export class UnfinalizedSuggestionService {
  static async suggestAllocations(
    generalItems: GeneralItemInput[],
  ): Promise<AllocationSuggestion> {
    if (generalItems.length === 0) {
      return { items: [] };
    }

    const normalized = generalItems.map(normalizeRequests);
    const partnerTotals = collectPartnerTotals(generalItems, normalized);

    const { client } = getOpenAIClient();
    let modelResponse: ModelResponse | null = null;

    if (client) {
      const payload = buildModelPayload(generalItems, normalized, partnerTotals);
      const userInstruction = `Review the normalized suggestions and adjust only when the heuristics call for it. Respond with JSON matching the schema.`;

      const response = await client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT || "omni-moderate",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify({ instruction: userInstruction, data: payload }) },
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

      modelResponse = parseModelResponse(response.choices?.[0]?.message?.content ?? undefined);
    }

    const adjusted = generalItems.map((item, index) =>
      sanitizeAllocations(item, normalized[index], modelResponse?.items?.[index]?.requests)
    );

    return buildBasicResult(adjusted);
  }
}

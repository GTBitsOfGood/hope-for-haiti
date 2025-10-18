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

  const safeWeights = weights.map((value) =>
    Number.isFinite(value) && value > 0 ? value : 0
  );
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

function collectPartnerTotals(
  items: GeneralItemInput[],
  normalized: number[][]
): Map<number, PartnerTotals> {
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

function buildModelPayload(
  items: GeneralItemInput[],
  normalized: number[][],
  partnerTotals: Map<number, PartnerTotals>
): ModelRequestPayload {
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

export class UnfinalizedSuggestionService {
  static async suggestAllocationsStream(
    generalItems: GeneralItemInput[],
    onChunk: (chunk: {
      itemIndex?: number;
      requests?: { partnerId: number; finalQuantity: number }[];
      done?: boolean;
    }) => void
  ): Promise<void> {
    if (generalItems.length === 0) {
      onChunk({ done: true });
      return;
    }

    const normalized = generalItems.map(normalizeRequests);
    const partnerTotals = collectPartnerTotals(generalItems, normalized);

    const { client } = getOpenAIClient();

    if (!client) {
      throw new Error("Azure OpenAI client is not available. Please configure AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables.");
    }

    const payload = buildModelPayload(
      generalItems,
      normalized,
      partnerTotals
    );
    const userInstruction = `Review the normalized suggestions and adjust only when the heuristics call for it. Respond with JSON matching the schema.`;

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "omni-moderate",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            instruction: userInstruction,
            data: payload,
          }),
        },
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
      stream: true,
    });

    let buffer = "";
    let braceDepth = 0;
    let currentItemIndex = 0;
    let inItemsArray = false;
    let inRequestsArray = false;
    let objStartIndex = 0;

    for await (const chunk of response) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (!content) continue;

      buffer += content;

      for (let i = 0; i < content.length; i++) {
        const char = content[i];

        // Track when inside items array
        if (!inItemsArray) {
          if (buffer.endsWith('"items":[') || buffer.endsWith('"items": [') || buffer.includes('"items":[') || buffer.includes('"items": [')) {
            inItemsArray = true;
          }
        }

        // Track when inside requests array of current item
        if (inItemsArray && !inRequestsArray) {
          if (buffer.endsWith('"requests":[') || buffer.endsWith('"requests": [') || buffer.includes('"requests":[') || buffer.includes('"requests": [')) {
            inRequestsArray = true;
          }
        }

        if (inRequestsArray) {
          if (char === '{') {
            if (braceDepth === 0) {
              // start of a new object
              objStartIndex = buffer.length - content.length + i;
            }
            braceDepth++;
          } else if (char === '}') {
            braceDepth--;
            if (braceDepth === 0) {
              // end of a full object
              const objEndIndex = buffer.length - content.length + i + 1;
              const objStr = buffer.slice(objStartIndex, objEndIndex);
              try {
                const parsed = JSON.parse(objStr);
                if (parsed && typeof parsed === 'object' && 'partnerId' in parsed && 'quantity' in parsed) {
                  onChunk({
                    itemIndex: currentItemIndex,
                    requests: [{ partnerId: parsed.partnerId, finalQuantity: parsed.quantity }],
                  });
                }
              } catch {
                // ignore parse errors for partial or invalid JSON
              }
            }
          } else if (char === ']') {
            // End of requests array for current item
            inRequestsArray = false;
            currentItemIndex++;
          }
        }

        if (inItemsArray && char === ']') {
          // End of items array
          inItemsArray = false;
        }
      }
    }

    onChunk({ done: true });
  }
}

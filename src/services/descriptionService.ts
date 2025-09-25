import { db } from "@/db";
import { getOpenAIClient } from "@/lib/azureOpenAI";

export type DescribeItemInput = {
  title: string;
  type: string;
  unitType: string;
};

export class DescriptionService {
  static makeBaseId(item: DescribeItemInput) {
    return `${item.title} | ${item.type} | ${item.unitType}`;
  }

  static makeCacheId(item: DescribeItemInput, language?: string) {
    const base = DescriptionService.makeBaseId(item);
    return language && language.length > 0 ? `${base} | lang:${language}` : base;
  }

  static async getOrGenerateDescriptions(items: DescribeItemInput[], language?: string): Promise<string[]> {
    // De-duplicate identical requests within the batch
    const baseIds = items.map(DescriptionService.makeBaseId);
  const targetIds = items.map((it) => DescriptionService.makeCacheId(it, language));
    const idsToFetch = new Set<string>();
    // Always fetch the target ids; if language provided, also fetch base ids to allow fallback
    targetIds.forEach((id) => idsToFetch.add(id));
    if (language && language.length > 0) baseIds.forEach((id) => idsToFetch.add(id));
    const uniqueIdsToFetch = Array.from(idsToFetch);

    // Fetch existing descriptions
    const existing = await db.descriptionLookup.findMany({
      where: { id: { in: uniqueIdsToFetch } },
    });
    const existingMap = new Map(existing.map((e) => [e.id, e.description] as const));

    // Determine which need generation
    const toGenerate: { id: string; item: DescribeItemInput }[] = [];
    targetIds.forEach((tid, index) => {
      if (!existingMap.has(tid)) {
        // If language provided and base exists, we can use base without generating
        const baseId = baseIds[index];
        const hasBase = existingMap.has(baseId);
        if (!hasBase) {
          toGenerate.push({ id: tid, item: items[index] });
        }
      }
    });

    // If no LLM needed, return in original order
    if (toGenerate.length === 0) {
      return targetIds.map((tid, idx) => existingMap.get(tid) || existingMap.get(baseIds[idx]) || "");
    }

    const { client } = getOpenAIClient();

    // If Azure is not configured, fall back to a simple deterministic template
    const generatedMap = new Map<string, string>();
    if (!client) {
      // No hardcoded language mapping; if base exists, prefer it. Otherwise, use a neutral template in English.
      for (const { id, item } of toGenerate) {
        const baseId = DescriptionService.makeBaseId(item);
        const base = existingMap.get(baseId);
        const desc = base ?? `"${item.title}" is a ${item.type.toLowerCase()} provided in ${item.unitType.toLowerCase()} units. It is intended for general use and distribution.`;
        generatedMap.set(id, desc);
      }
    } else {
      // Batch prompt engineering: generate concise, safe descriptions for multiple items at once
      const system = `You are a helpful assistant that writes neutral product descriptions.
- Keep each description to 1-2 short sentences.
- Avoid clinical claims, dosing, or medical advice.
- Use plain language and mention the item's purpose at a high level.
- If a field is generic, keep wording generic.
- Do not include the name of the medication in the description`;

      const userLines = toGenerate
        .map(({ item }, idx) => `${idx + 1}. title="${item.title}", type="${item.type}", unitType="${item.unitType}"`)
        .join("\n");
      const languageLine = language && language.length > 0 ? `Respond in language: ${language}.` : "";
      const user = `Write basic descriptions for these items, one per line and in order. ${languageLine} Return JSON only that matches the provided schema.\n${userLines}`;

      const response = await client.chat.completions.create({
        // For Azure OpenAI with OpenAI SDK: pass the deployment name to `model`
        model: process.env.AZURE_OPENAI_DEPLOYMENT || "omni-moderate",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "descriptions_schema",
            schema: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["items"],
              additionalProperties: false,
            },
            strict: true,
          },
        },
      });

      const content = response.choices?.[0]?.message?.content ?? "";
      let arr: string[] = [];
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed?.items)) {
          arr = parsed.items as string[];
        }
      } catch {

      }

      if (arr.length !== toGenerate.length) {
        while (arr.length < toGenerate.length) arr.push("");
        arr = arr.slice(0, toGenerate.length);
      }

      toGenerate.forEach((entry, idx) => {
        const raw = (arr[idx] ?? "").toString().trim();
        const safe = raw.length > 0 ? raw : `"${entry.item.title}" is a ${entry.item.type.toLowerCase()} provided in ${entry.item.unitType.toLowerCase()} units.`;
        generatedMap.set(entry.id, safe);
      });
    }

    // Persist newly generated ones
    const writes = Array.from(generatedMap.entries()).map(([id, description]) =>
      db.descriptionLookup.upsert({
        where: { id },
        update: { description },
        create: { id, description },
      })
    );
    if (writes.length) await Promise.all(writes);

    // Merge existing + newly generated, return in original order
    const finalMap = new Map<string, string>([...existingMap, ...generatedMap]);
    return targetIds.map((tid, idx) => finalMap.get(tid) || finalMap.get(baseIds[idx]) || "");
  }
}

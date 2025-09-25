import { db } from "@/db";
import { getOpenAIClient } from "@/lib/azureOpenAI";

export type DescribeItemInput = {
  title: string;
  type: string;
  unitType: string;
};

export class DescriptionService {
  static makeId(item: DescribeItemInput) {
    return `${item.title} | ${item.type} | ${item.unitType}`;
  }

  static async getOrGenerateDescriptions(items: DescribeItemInput[]): Promise<string[]> {
    // De-duplicate identical requests within the batch
    const ids = items.map(DescriptionService.makeId);
    const uniqueIds = Array.from(new Set(ids));

    // Fetch existing descriptions
    const existing = await db.descriptionLookup.findMany({
      where: { id: { in: uniqueIds } },
    });
    const existingMap = new Map(existing.map((e) => [e.id, e.description] as const));

    // Determine which need generation
    const toGenerate: { id: string; item: DescribeItemInput }[] = [];
    uniqueIds.forEach((id) => {
      if (!existingMap.has(id)) {
        toGenerate.push({ id, item: items[ids.indexOf(id)] });
      }
    });

    // If no LLM needed, return in original order
    if (toGenerate.length === 0) {
      return ids.map((id) => existingMap.get(id) || "");
    }

    const { client } = getOpenAIClient();

    // If Azure is not configured, fall back to a simple deterministic template
    const generatedMap = new Map<string, string>();
    if (!client) {
      for (const { id, item } of toGenerate) {
        const desc = `"${item.title}" is a ${item.type.toLowerCase()} provided in ${item.unitType.toLowerCase()} units. It is intended for general use and distribution.`;
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
        .map(({ item }, i) => `${i + 1}. title="${item.title}", type="${item.type}", unitType="${item.unitType}"`)
        .join("\n");
      const user = `Write basic descriptions for these items, one per line and in order. Return JSON only that matches the provided schema.\n${userLines}`;

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
    return ids.map((id) => finalMap.get(id) || "");
  }
}

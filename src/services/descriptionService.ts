import { db } from "@/db";
import { getOpenAIClient } from "@/lib/azureOpenAI";

export type DescribeItemInput = {
  title: string;
  unitType: string;
};

type BilingualDescription = {
  haitian: string;
  english: string;
};

export class DescriptionService {
  static makeCacheId(item: DescribeItemInput) {
    return `${item.title} | ${item.unitType}`;
  }

  static async getOrGenerateDescriptions(
    items: DescribeItemInput[]
  ): Promise<string[]> {
    if (items.length === 0) return [];

    const ids = items.map(DescriptionService.makeCacheId);
    const existing = await db.descriptionLookup.findMany({
      where: { id: { in: ids } },
    });
    const existingMap = new Map(
      existing.map((entry: { id: string; description: string }) => [
        entry.id,
        entry.description,
      ])
    );

    const missing: { id: string; item: DescribeItemInput }[] = [];
    const missingIds = new Set<string>();
    ids.forEach((id, index) => {
      if (!existingMap.has(id) && !missingIds.has(id)) {
        missing.push({ id, item: items[index] });
        missingIds.add(id);
      }
    });

    const generated = await DescriptionService.generateDescriptions(
      missing.map((entry) => entry.item)
    );
    const generatedMap = new Map<string, string>();
    missing.forEach((entry, index) => {
      const combined = DescriptionService.combineDescriptions(
        generated[index] ?? DescriptionService.defaultDescription(entry.item)
      );
      generatedMap.set(entry.id, combined);
    });

    if (generatedMap.size > 0) {
      await Promise.all(
        Array.from(generatedMap.entries()).map(([id, description]) =>
          db.descriptionLookup.upsert({
            where: { id },
            update: { description },
            create: { id, description },
          })
        )
      );
    }

    const finalMap = new Map([...existingMap, ...generatedMap]) as Map<
      string,
      string
    >;
    return ids.map(
      (id, index) =>
        finalMap.get(id) ||
        DescriptionService.combineDescriptions(
          DescriptionService.defaultDescription(items[index])
        )
    );
  }

  private static async generateDescriptions(
    items: DescribeItemInput[]
  ): Promise<BilingualDescription[]> {
    if (items.length === 0) return [];

    const { client } = getOpenAIClient();
    if (!client) return items.map(DescriptionService.defaultDescription);

    const system = `You write practical medical supply descriptions that explain what each item is used for.
- Focus on what conditions/symptoms the item treats or what medical purposes it serves.
- Produce one Haitian Creole sentence and one English sentence for each item.
- Keep language simple and direct - healthcare workers need to know what this helps with, not just what it is.
- For medications: mention the conditions treated, symptoms relieved, or medical uses.
- For supplies: mention the medical procedures or patient care situations where they're used.
- Avoid complex medical jargon, but DO explain the practical medical use.`;

    const userLines = items
      .map(
        (item, index) =>
          `${index + 1}. title="${item.title}", unitType="${item.unitType}"`
      )
      .join("\n");
    const user = `Return a JSON object with an 'items' array. Each element must include 'haitian' and 'english' string fields.

IMPORTANT: Describe what each item DOES or what it's USED FOR medically, not just what it is. Healthcare workers need to know what conditions this treats or what medical purposes it serves.

Examples:
- Instead of "Ibuprofen is a pain medication in tablet form" → "Used to treat pain, fever, and inflammation from conditions like headaches, arthritis, and injuries"
- Instead of "Bandages are wound covering supplies" → "Used to protect wounds, stop bleeding, and prevent infection after injuries or surgery"

${userLines}`;

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "omni-moderate",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "bilingual_descriptions",
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    haitian: { type: "string" },
                    english: { type: "string" },
                  },
                  required: ["haitian", "english"],
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

    const content = response.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed?.items)) {
        return parsed.items.map((entry: BilingualDescription, index: number) =>
          DescriptionService.normalizeDescription(entry, items[index])
        );
      }
    } catch {
      // Fall through to deterministic fallback below.
    }

    return items.map(DescriptionService.defaultDescription);
  }

  private static normalizeDescription(
    value: Partial<BilingualDescription> | undefined,
    item: DescribeItemInput
  ): BilingualDescription {
    const fallback = DescriptionService.defaultDescription(item);
    const haitian =
      DescriptionService.cleanText(value?.haitian) || fallback.haitian;
    const english =
      DescriptionService.cleanText(value?.english) || fallback.english;
    return { haitian, english };
  }

  private static defaultDescription(
    item: DescribeItemInput
  ): BilingualDescription {
    const lowerUnit = item.unitType.toLowerCase();
    const english = `Medical supply: ${item.title}. Consult medical staff for proper use and indications. Supplied in ${lowerUnit} units.`;
    const haitian = `Founiti medikal: ${item.title}. Konsилte pèsonèl medikal pou jan pou itilize l kòrèkteman. Disponib nan inite ${lowerUnit}.`;
    return { haitian, english };
  }

  private static combineDescriptions(value: BilingualDescription): string {
    const haitian = DescriptionService.cleanText(value.haitian);
    const english = DescriptionService.cleanText(value.english);
    return `${haitian} / ${english}`;
  }

  private static cleanText(value: string | undefined): string {
    return (value ?? "")
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

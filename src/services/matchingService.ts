// src/services/MatchingService.ts
import { ChromaClient, type Collection, type Where } from "chromadb";
import { getOpenAIClient } from "@/lib/azureOpenAI";
// ---- Schema reference (no Prisma usage) ------------------------------------
// GeneralItem: { id: Int, donorOfferId: Int, title: String }

type ItemInput = {
  id: number;
  title: string;
  donorOfferId: number;
};

// ---- Chroma setup -----------------------------------------------------------
const chroma = new ChromaClient({
  host: process.env.CHROMA_HOST || "http://localhost",
  port: process.env.CHROMA_PORT ? parseInt(process.env.CHROMA_PORT, 10) : 8000,
});

// Create/get once at module load
const collectionP: Promise<Collection> = chroma.getOrCreateCollection({
  name: "general-items",
  embeddingFunction: null,
});

// ---- Internal helpers -------------------------------------------------------

async function embed(texts: string[]): Promise<number[][]> {
  const { client, deployment, reason } = getOpenAIClient(true);
  if (!client || !deployment) {
    throw new Error(
      `Azure OpenAI client not configured: ${reason ?? "unknown reason"}`
    );
  }

  const resp = await client.embeddings.create({
    model: deployment, // use Azure deployment name
    input: texts,
  });

  const data = resp.data.map((d) => d.embedding as number[]);

  /*
  const embeddingFunction = new DefaultEmbeddingFunction();
  const data = await embeddingFunction.generate(texts);*/

  return data;
}

function asArray<T>(x: T | T[]): T[] {
  return Array.isArray(x) ? x : [x];
}

function assertAtLeastOneDefined<T, U>(a?: T, b?: U) {
  if (a == null && b == null) {
    throw new Error(
      "At least one of 'ids' or 'donorOfferId' must be provided."
    );
  }
}

// ---- MatchingService --------------------------------------------------------

export class MatchingService {
  /**
   * Add to vector store (single or batch).
   */
  static async add(items: ItemInput | ItemInput[]): Promise<void> {
    const batch = asArray(items);
    if (!batch.length) return;

    const collection = await collectionP;
    const titles = batch.map((i) => i.title);
    const vectors = await embed(titles);

    await collection.add({
      ids: batch.map((i) => String(i.id)),
      documents: titles,
      embeddings: vectors,
      metadatas: batch.map((i) => ({ donorOfferId: i.donorOfferId })),
    });
  }

  /**
   * Remove from vector store by ids or donorOfferId.
   */
  static async remove(params: {
    ids?: number[];
    donorOfferId?: number;
  }): Promise<void> {
    const { ids, donorOfferId } = params;
    assertAtLeastOneDefined(ids, donorOfferId);

    const collection = await collectionP;

    if (ids?.length) {
      await collection.delete({ ids: ids.map(String) });
    }
    if (donorOfferId != null) {
      const where: Where = { donorOfferId };
      await collection.delete({ where });
    }
  }

  /**
   * Modify existing vectors (single or batch).
   */
  static async modify(
    items:
      | (Partial<Pick<ItemInput, "title" | "donorOfferId">> & { id: number })
      | Array<
          Partial<Pick<ItemInput, "title" | "donorOfferId">> & { id: number }
        >
  ): Promise<void> {
    const batch = asArray(items);
    if (!batch.length) return;

    const collection = await collectionP;

    const indicesNeedingEmbed: number[] = [];
    const titlesToEmbed: string[] = [];

    batch.forEach((item, idx) => {
      if (typeof item.title === "string") {
        indicesNeedingEmbed.push(idx);
        titlesToEmbed.push(item.title);
      }
    });

    let newVectors: number[][] = [];
    if (titlesToEmbed.length) {
      newVectors = await embed(titlesToEmbed);
    }

    const ids = batch.map((i) => String(i.id));
    const documents = batch.map((i) =>
      typeof i.title === "string" ? i.title : null
    );
    const metadatas = batch.map((i) =>
      typeof i.donorOfferId === "number"
        ? { donorOfferId: i.donorOfferId }
        : null
    );

    const embeddings: (number[] | null)[] = Array(batch.length).fill(null);
    indicesNeedingEmbed.forEach((pos, j) => {
      embeddings[pos] = newVectors[j];
    });

    await collection.update({
      ids,
      // cast arrays that may contain nulls to the types expected by the client
      documents: documents as string[],
      metadatas: metadatas as Record<string, number>[],
      embeddings: embeddings as number[][],
    });
  }

  /**
   * Get top-K matches for one or many query strings.
   * - Embeds the string(s) and uses queryEmbeddings (NOT queryTexts).
   * - Returns per-query top-K results with distance/similarity and "soft"/"hard" label.
   * - Filters out weak matches by a distance cutoff.
   *
   * Overloads:
   *  - { query: string,   ... } -> Promise<Match[]>
   *  - { queries: string[], ... } -> Promise<Match[][]>
   */
  static async getTopKMatches(params: {
    query: string;
    k: number;
    donorOfferId?: number;
    distanceCutoff?: number; // default 0.25  (0.25 ≈ sim 0.75)
    hardCutoff?: number; // default 0.10  (0.10 ≈ sim 0.90)
  }): Promise<
    Array<{
      id: number;
      title: string;
      donorOfferId: number | null;
      distance: number;
      similarity: number;
      strength: "hard" | "soft";
    }>
  >;
  static async getTopKMatches(params: {
    queries: string[];
    k: number;
    donorOfferId?: number;
    distanceCutoff?: number; // default 0.25
    hardCutoff?: number; // default 0.10
  }): Promise<
    Array<
      Array<{
        id: number;
        title: string;
        donorOfferId: number | null;
        distance: number;
        similarity: number;
        strength: "hard" | "soft";
      }>
    >
  >;
  static async getTopKMatches(params: {
    query?: string;
    queries?: string[];
    k: number;
    donorOfferId?: number;
    distanceCutoff?: number;
    hardCutoff?: number;
  }): Promise<
    | Array<{
        id: number;
        title: string;
        donorOfferId: number | null;
        distance: number;
        similarity: number;
        strength: "hard" | "soft";
      }>
    | Array<
        Array<{
          id: number;
          title: string;
          donorOfferId: number | null;
          distance: number;
          similarity: number;
          strength: "hard" | "soft";
        }>
      >
  > {
    const {
      query,
      queries,
      k,
      donorOfferId,
      distanceCutoff = 0.25,
      hardCutoff = 0.1,
    } = params;

    // Normalize input to an array, preserving positions for empty/trimmed queries
    const original: (string | undefined)[] =
      queries ?? (typeof query === "string" ? [query] : []);
    if (!original.length) return Array.isArray(queries) ? [] : [];

    const normalized: { text: string; index: number }[] = [];
    original.forEach((q, i) => {
      const t = (q ?? "").trim();
      if (t.length > 0) normalized.push({ text: t, index: i });
    });

    // If all queries were empty, return appropriately
    if (!normalized.length)
      return Array.isArray(queries) ? original.map(() => []) : [];

    const collection = await collectionP;

    // Embed only the non-empty queries, keep an index map
    const embeddings = await embed(normalized.map((q) => q.text)); // number[][]
    const res = await collection.query({
      queryEmbeddings: embeddings,
      nResults: k,
      where: donorOfferId != null ? { donorOfferId } : undefined,
      include: ["documents", "distances", "metadatas"],
    });

    // Helper to convert one query's result row into our shape
    const buildMatches = (qIdx: number) => {
      const ids = res.ids?.[qIdx] ?? [];
      const docs = res.documents?.[qIdx] ?? [];
      const dists = res.distances?.[qIdx] ?? [];
      const metas = (res.metadatas?.[qIdx] ?? []) as Array<
        Record<string, unknown>
      >;

      const rows = ids.map((id, i) => {
        const distance =
          typeof dists[i] === "number" ? (dists[i] as number) : 1;
        const similarity = 1 - distance;
        const meta = metas[i] ?? {};
        const donorOfferIdMeta =
          typeof meta.donorOfferId === "number"
            ? (meta.donorOfferId as number)
            : null;

        const matchType: "hard" | "soft" =
          distance <= hardCutoff ? "hard" : "soft";

        return {
          id: Number(id),
          title: typeof docs[i] === "string" ? (docs[i] as string) : "",
          donorOfferId: donorOfferIdMeta,
          distance,
          similarity: Number.isFinite(similarity) ? similarity : 0,
          strength: matchType,
        };
      });

      return rows.filter((r) => r.distance <= distanceCutoff).slice(0, k);
    };

    // Chroma returns one list per query in the *embedded order*
    // We must place each list back at its original index; empty inputs produce []
    const perEmbedded = normalized.map((_, i) => buildMatches(i));
    const perOriginal: Array<
      Array<{
        id: number;
        title: string;
        donorOfferId: number | null;
        distance: number;
        similarity: number;
        strength: "hard" | "soft";
      }>
    > = original.map(() => []); // seed with empties
    normalized.forEach(({ index }, i) => {
      perOriginal[index] = perEmbedded[i];
    });

    // Backward compatibility:
    // - If the caller passed a single `query`, return Match[]
    // - If the caller passed `queries`, return Match[][]
    return Array.isArray(queries) ? perOriginal : (perOriginal[0] ?? []);
  }
}

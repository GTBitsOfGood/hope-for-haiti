// src/services/MatchingService.ts
import { ChromaClient, type Collection, type Where } from "chromadb";
import { getOpenAIClient } from "@/lib/azureOpenAI";
import { OpenAIEmbeddingFunction } from "@chroma-core/openai";
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
   * Get top-K matches for a query string.
   * - Embeds the string and uses queryEmbeddings (NOT queryTexts).
   * - Returns the top-K results **with** distance/similarity and a "soft"/"hard" match label.
   * - Filters out weak matches by a distance cutoff.
   */
  static async getTopKMatches(params: {
    query: string;
    k: number;
    donorOfferId?: number;
    /**
     * Exclude results farther than this cosine distance.
     * (Smaller = closer; 0.25 ≈ sim 0.75)
     */
    distanceCutoff?: number; // default 0.25
    /**
     * Distance threshold for a "hard" match (<= hardCutoff = hard; else soft).
     * (0.10 ≈ sim 0.90)
     */
    hardCutoff?: number; // default 0.10
  }): Promise<
    Array<{
      id: number;
      title: string;
      donorOfferId: number | null;
      distance: number; // cosine distance (smaller is better)
      similarity: number; // 1 - distance
      strength: "hard" | "soft";
    }>
  > {
    const {
      query,
      k,
      donorOfferId,
      distanceCutoff = 0.25,
      hardCutoff = 0.1,
    } = params;

    const collection = await collectionP;
    const [qvec] = await embed([query]);

    const res = await collection.query({
      queryEmbeddings: [qvec],
      nResults: k,
      where: donorOfferId != null ? { donorOfferId } : undefined,
      include: ["documents", "distances", "metadatas"],
    });

    const ids = res.ids?.[0] ?? [];
    const docs = res.documents?.[0] ?? [];
    const dists = res.distances?.[0] ?? [];
    const metas = (res.metadatas?.[0] ?? []) as Array<Record<string, unknown>>;

    // Build + filter + label
    const raw = ids.map((id, i) => {
      const distance = typeof dists[i] === "number" ? (dists[i] as number) : 1;
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

    // Exclude weak matches and cap to K (defensive slice after filter)
    return raw.filter((r) => r.distance <= distanceCutoff).slice(0, k);
  }
}

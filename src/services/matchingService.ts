// src/services/MatchingService.ts
import { Prisma } from "@prisma/client";
import { db } from "@/db";
import { getOpenAIClient } from "@/lib/azureOpenAI";

const EMBEDDING_DIMENSION = 1536;

type BaseMetadata = {
  generalItemId?: number | null;
  wishlistId?: number | null;
  donorOfferId?: number | null;
};

type ItemInput = BaseMetadata & {
  title: string;
};

type ModifyInput = BaseMetadata & {
  title?: string;
};

type RemoveParams = {
  embeddingIds?: number[];
  generalItemIds?: number[];
  wishlistIds?: number[];
  donorOfferIds?: number[];
};

type SearchFilters = BaseMetadata & {
  generalItemIds?: number[];
  wishlistIds?: number[];
  donorOfferIds?: number[];
};

type SingleQueryParams = SearchFilters & {
  query: string;
  k: number;
  distanceCutoff?: number;
  hardCutoff?: number;
};

type MultiQueryParams = SearchFilters & {
  queries: string[];
  k: number;
  distanceCutoff?: number;
  hardCutoff?: number;
};

type MatchRow = {
  embeddingId: number;
  generalItemId: number | null;
  wishlistId: number | null;
  donorOfferId: number | null;
  generalItemTitle: string | null;
  wishlistTitle: string | null;
  distance: number | null;
};

export type MatchResult = {
  id: number;
  embeddingId: number;
  generalItemId: number | null;
  wishlistId: number | null;
  donorOfferId: number | null;
  title: string;
  distance: number;
  similarity: number;
  strength: "hard" | "soft";
};

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

  return resp.data.map((d) => d.embedding as number[]);
}

function asArray<T>(x: T | T[]): T[] {
  return Array.isArray(x) ? x : [x];
}

function vectorToSql(embedding: number[]): Prisma.Sql {
  if (embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding dimension mismatch: expected ${EMBEDDING_DIMENSION}, received ${embedding.length}.`
    );
  }

  const sanitized = embedding.map((value) =>
    Number.isFinite(value) ? Number(value) : 0
  );

  const literal = `'[${sanitized.join(",")}]'::vector`;
  return Prisma.raw(literal);
}

function dedupeNumbers(values: Array<number | null | undefined>): number[] {
  const seen = new Set<number>();
  const result: number[] = [];

  values.forEach((value) => {
    if (typeof value === "number" && Number.isFinite(value) && !seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  });

  return result;
}

function normalizeId(value: unknown, label: string): number | null {
  if (value == null) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return num;
}

function joinSql(parts: Prisma.Sql[], separator: Prisma.Sql): Prisma.Sql {
  if (!parts.length) {
    return Prisma.sql``;
  }

  return parts.slice(1).reduce(
    (acc, part) => Prisma.sql`${acc}${separator}${part}`,
    parts[0]
  );
}

function resolveTarget(
  item: BaseMetadata
): { generalItemId: number | null; wishlistId: number | null } {
  const generalItemId =
    normalizeId(item.generalItemId, "generalItemId");
  const wishlistId = normalizeId(item.wishlistId, "wishlistId");

  if (
    (generalItemId != null && wishlistId != null) ||
    (generalItemId == null && wishlistId == null)
  ) {
    throw new Error(
      "Provide exactly one of generalItemId or wishlistId for embedding operations."
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(item, "donorOfferId") &&
    generalItemId == null
  ) {
    throw new Error(
      "donorOfferId can only be associated with a general item embedding."
    );
  }

  return { generalItemId, wishlistId };
}

function buildSearchWhereClause(filters: SearchFilters): Prisma.Sql | null {
  const conditions: Prisma.Sql[] = [];

  const generalIds = dedupeNumbers([
    filters.generalItemId,
    ...(filters.generalItemIds ?? []),
  ]);
  if (generalIds.length === 1) {
    conditions.push(Prisma.sql`emb."generalItemId" = ${generalIds[0]}`);
  } else if (generalIds.length > 1) {
    conditions.push(Prisma.sql`emb."generalItemId" = ANY(${generalIds})`);
  }

  const wishlistIds = dedupeNumbers([
    filters.wishlistId,
    ...(filters.wishlistIds ?? []),
  ]);
  if (wishlistIds.length === 1) {
    conditions.push(Prisma.sql`emb."wishlistId" = ${wishlistIds[0]}`);
  } else if (wishlistIds.length > 1) {
    conditions.push(Prisma.sql`emb."wishlistId" = ANY(${wishlistIds})`);
  }

  const donorOfferIds = dedupeNumbers([
    filters.donorOfferId,
    ...(filters.donorOfferIds ?? []),
  ]);
  if (donorOfferIds.length === 1) {
    conditions.push(Prisma.sql`emb."donorOfferId" = ${donorOfferIds[0]}`);
  } else if (donorOfferIds.length > 1) {
    conditions.push(Prisma.sql`emb."donorOfferId" = ANY(${donorOfferIds})`);
  }

  if (!conditions.length) return null;
  return Prisma.sql`WHERE ${joinSql(conditions, Prisma.sql` AND `)}`;
}

function buildDeleteConditions(params: {
  embeddingIds?: number[];
  generalItemIds?: number[];
  wishlistIds?: number[];
  donorOfferIds?: number[];
}): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = [];

  const embeddingIds = params.embeddingIds ?? [];
  const generalIds = params.generalItemIds ?? [];
  const wishlistIds = params.wishlistIds ?? [];
  const donorIds = params.donorOfferIds ?? [];

  if (embeddingIds.length === 1) {
    conditions.push(Prisma.sql`"id" = ${embeddingIds[0]}`);
  } else if (embeddingIds.length > 1) {
    conditions.push(Prisma.sql`"id" = ANY(${embeddingIds})`);
  }

  if (generalIds.length === 1) {
    conditions.push(
      Prisma.sql`"generalItemId" = ${generalIds[0]}`
    );
  } else if (generalIds.length > 1) {
    conditions.push(Prisma.sql`"generalItemId" = ANY(${generalIds})`);
  }

  if (wishlistIds.length === 1) {
    conditions.push(Prisma.sql`"wishlistId" = ${wishlistIds[0]}`);
  } else if (wishlistIds.length > 1) {
    conditions.push(Prisma.sql`"wishlistId" = ANY(${wishlistIds})`);
  }

  if (donorIds.length === 1) {
    conditions.push(Prisma.sql`"donorOfferId" = ${donorIds[0]}`);
  } else if (donorIds.length > 1) {
    conditions.push(Prisma.sql`"donorOfferId" = ANY(${donorIds})`);
  }

  return conditions;
}

export class MatchingService {
  /**
   * Add to the vector store (single or batch).
   */
  static async add(items: ItemInput | ItemInput[]): Promise<void> {
    const batch = asArray(items)
      .map((item) => ({
        raw: item,
        text: typeof item.title === "string" ? item.title.trim() : "",
      }))
      .filter((item) => item.text.length > 0);

    if (!batch.length) return;

    const vectors = await embed(batch.map((item) => item.text));

    await Promise.all(
      batch.map(async ({ raw }, idx) => {
        const identifiers = resolveTarget(raw);
        const donorOfferId =
          identifiers.generalItemId != null
            ? normalizeId(raw.donorOfferId, "donorOfferId")
            : null;
        const embeddingExpr = vectorToSql(vectors[idx]);

        const generalItemIdPart = identifiers.generalItemId !== null
          ? Prisma.sql`${identifiers.generalItemId}`
          : Prisma.raw('NULL');
        const wishlistIdPart = identifiers.wishlistId !== null
          ? Prisma.sql`${identifiers.wishlistId}`
          : Prisma.raw('NULL');
        const donorOfferIdPart = donorOfferId !== null
          ? Prisma.sql`${donorOfferId}`
          : Prisma.raw('NULL');

        if (identifiers.generalItemId !== null) {
          await db.$executeRaw(
            Prisma.sql`
              INSERT INTO "ItemEmbeddings" ("generalItemId", "wishlistId", "donorOfferId", "embedding", "updatedAt")
              VALUES (${generalItemIdPart}, ${wishlistIdPart}, ${donorOfferIdPart}, ${embeddingExpr}, CURRENT_TIMESTAMP)
              ON CONFLICT ("generalItemId")
              DO UPDATE SET
                "embedding" = EXCLUDED."embedding",
                "donorOfferId" = EXCLUDED."donorOfferId",
                "updatedAt" = CURRENT_TIMESTAMP
            `
          );
        } else if (identifiers.wishlistId !== null) {
          await db.$executeRaw(
            Prisma.sql`
              INSERT INTO "ItemEmbeddings" ("generalItemId", "wishlistId", "donorOfferId", "embedding", "updatedAt")
              VALUES (${generalItemIdPart}, ${wishlistIdPart}, ${donorOfferIdPart}, ${embeddingExpr}, CURRENT_TIMESTAMP)
              ON CONFLICT ("wishlistId")
              DO UPDATE SET
                "embedding" = EXCLUDED."embedding",
                "donorOfferId" = EXCLUDED."donorOfferId",
                "updatedAt" = CURRENT_TIMESTAMP
            `
          );
        }
      })
    );
  }

  /**
   * Remove from the vector store using any supported metadata.
   */
  static async remove(params: RemoveParams): Promise<void> {
    const embeddingTargets = dedupeNumbers(params.embeddingIds ?? []);
    const generalTargets = dedupeNumbers(params.generalItemIds ?? []);
    const wishlistTargets = dedupeNumbers(params.wishlistIds ?? []);
    const donorTargets = dedupeNumbers(params.donorOfferIds ?? []);

    if (
      !embeddingTargets.length &&
      !generalTargets.length &&
      !wishlistTargets.length &&
      !donorTargets.length
    ) {
      throw new Error(
        "Provide at least one identifier: embeddingIds, generalItemIds, wishlistIds, or donorOfferIds."
      );
    }

    const conditions = buildDeleteConditions({
      embeddingIds: embeddingTargets,
      generalItemIds: generalTargets,
      wishlistIds: wishlistTargets,
      donorOfferIds: donorTargets,
    });

    const whereClause =
      conditions.length === 1
        ? conditions[0]
        : joinSql(conditions, Prisma.sql` OR `);

    await db.$executeRaw(
      Prisma.sql`
        DELETE FROM "ItemEmbeddings"
        WHERE ${whereClause}
      `
    );
  }

  /**
   * Modify existing vectors (single or batch).
   */
  static async modify(
    items: ModifyInput | ModifyInput[]
  ): Promise<void> {
    const batch = asArray(items);
    if (!batch.length) return;

    const itemsNeedingEmbed: Array<{ index: number; text: string }> = [];
    const normalized = batch.map((item, index) => {
      const identifiers = resolveTarget(item);
      const text =
        typeof item.title === "string" ? item.title.trim() : undefined;
      if (text && text.length > 0) {
        itemsNeedingEmbed.push({ index, text });
      }

      const hasDonorOfferId = Object.prototype.hasOwnProperty.call(
        item,
        "donorOfferId"
      );

      const donorOfferId = hasDonorOfferId
        ? normalizeId(item.donorOfferId ?? null, "donorOfferId")
        : undefined;

      return {
        identifiers,
        text,
        donorOfferId,
      };
    });

    const vectors = itemsNeedingEmbed.length
      ? await embed(itemsNeedingEmbed.map((item) => item.text))
      : [];

    let vectorCursor = 0;
    for (let i = 0; i < normalized.length; i += 1) {
      const entry = normalized[i];
      const updates: Prisma.Sql[] = [];

      if (entry.text && entry.text.length > 0) {
        const embeddingExpr = vectorToSql(vectors[vectorCursor]);
        vectorCursor += 1;
        updates.push(Prisma.sql`"embedding" = ${embeddingExpr}`);
      }

      if (entry.donorOfferId !== undefined) {
        updates.push(
          Prisma.sql`"donorOfferId" = ${entry.donorOfferId}`
        );
      }

      if (!updates.length) continue;

      updates.push(Prisma.sql`"updatedAt" = CURRENT_TIMESTAMP`);

      const whereFragments: Prisma.Sql[] = [];
      if (entry.identifiers.generalItemId != null) {
        whereFragments.push(
          Prisma.sql`"generalItemId" = ${entry.identifiers.generalItemId}`
        );
      }
      if (entry.identifiers.wishlistId != null) {
        whereFragments.push(
          Prisma.sql`"wishlistId" = ${entry.identifiers.wishlistId}`
        );
      }

      const whereClause =
        whereFragments.length === 1
          ? whereFragments[0]
          : joinSql(whereFragments, Prisma.sql` AND `);

      await db.$executeRaw(
        Prisma.sql`
          UPDATE "ItemEmbeddings"
          SET ${joinSql(updates, Prisma.sql`, `)}
          WHERE ${whereClause}
        `
      );
    }
  }

  /**
   * Get top-K matches for one or many query strings.
   */
  static async getTopKMatches(params: SingleQueryParams): Promise<MatchResult[]>;
  static async getTopKMatches(
    params: MultiQueryParams
  ): Promise<MatchResult[][]>;
  static async getTopKMatches(
    params: SingleQueryParams | MultiQueryParams
  ): Promise<MatchResult[] | MatchResult[][]> {
    const { k, distanceCutoff = 0.4, hardCutoff = 0.25 } = params;

    let original: (string | undefined)[];
    let isMulti = false;
    if ("queries" in params) {
      original = params.queries;
      isMulti = true;
    } else {
      original = [params.query];
    }

    if (!original.length) return isMulti ? [] : [];

    const normalized: { text: string; index: number }[] = [];
    original.forEach((q, i) => {
      const t = (q ?? "").trim();
      if (t.length > 0) normalized.push({ text: t, index: i });
    });

    if (!normalized.length)
      return isMulti ? original.map(() => []) : [];

    const embeddings = await embed(normalized.map((q) => q.text));
    const metadataFilters: SearchFilters = {
      generalItemId: params.generalItemId,
      generalItemIds: params.generalItemIds,
      wishlistId: params.wishlistId,
      wishlistIds: params.wishlistIds,
      donorOfferId: params.donorOfferId,
      donorOfferIds: params.donorOfferIds,
    };

    const perEmbedded = await Promise.all(
      embeddings.map(async (embedding) => {
        const vectorExpr = vectorToSql(embedding);
        const whereClause = buildSearchWhereClause(metadataFilters);

        const clauses: Prisma.Sql[] = [
          Prisma.sql`
            WITH q AS (SELECT ${vectorExpr} AS embedding)
            SELECT
              emb."id" AS "embeddingId",
              emb."generalItemId" AS "generalItemId",
              emb."wishlistId" AS "wishlistId",
              emb."donorOfferId" AS "donorOfferId",
              gi."title" AS "generalItemTitle",
              wl."name" AS "wishlistTitle",
              emb."embedding" <=> q.embedding AS "distance"
            FROM "ItemEmbeddings" emb
            CROSS JOIN q
            LEFT JOIN "GeneralItem" gi ON gi."id" = emb."generalItemId"
            LEFT JOIN "Wishlist" wl ON wl."id" = emb."wishlistId"
          `,
        ];

        if (whereClause) {
          clauses.push(whereClause);
        }

        clauses.push(
          Prisma.sql`
            ORDER BY emb."embedding" <=> q.embedding
            LIMIT ${k}
          `
        );

        const querySql =
          clauses.length === 1
            ? clauses[0]
            : joinSql(clauses, Prisma.sql`\n`);

        const rows = await db.$queryRaw<MatchRow[]>(querySql);

        return rows
          .map<MatchResult>((row) => {
            const distance =
              typeof row.distance === "number" && Number.isFinite(row.distance)
                ? row.distance
                : 1;
            const similarity = 1 - distance;

            const title =
              row.generalItemTitle ??
              row.wishlistTitle ??
              "";
            const id =
              row.generalItemId ??
              row.wishlistId ??
              null;

            if (id == null) {
              throw new Error("Found embedding without a linked generalItemId or wishlistId.");
            }

            const donorOfferId =
              row.donorOfferId != null
                ? row.donorOfferId
                : null;

            return {
              id,
              embeddingId: row.embeddingId,
              generalItemId: row.generalItemId,
              wishlistId: row.wishlistId,
              donorOfferId,
              title,
              distance,
              similarity: Number.isFinite(similarity) ? similarity : 0,
              strength: distance <= hardCutoff ? "hard" : "soft",
            };
          })
          .filter((match) => match.distance <= distanceCutoff);
      })
    );

    const perOriginal: MatchResult[][] = original.map(() => []);
    normalized.forEach(({ index }, i) => {
      perOriginal[index] = perEmbedded[i];
    });

    return isMulti ? perOriginal : perOriginal[0] ?? [];
  }
}

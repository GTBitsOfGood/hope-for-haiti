import { Prisma } from "@prisma/client";
import { db } from "@/db";
import { getOpenAIClient } from "@/lib/azureOpenAI";

const EMBEDDING_DIMENSION = 1536;

export type CachedEmbedding = {
  id: number;
  generalItemId: number | null;
  title: string;
  unitType?: string;
  embedding: number[];
  expirationDate: Date | null;
};

export type EmbeddingCache = Map<number, CachedEmbedding[]>;

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
    model: deployment,
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

    static async remove(params: RemoveParams): Promise<void> {
    const embeddingTargets = dedupeNumbers(params.embeddingIds ?? []);
    const wishlistTargets = dedupeNumbers(params.wishlistIds ?? []);

    if (!embeddingTargets.length && !wishlistTargets.length) {
      throw new Error(
        "Provide at least one identifier: embeddingIds or wishlistIds. Note: Item embeddings cannot be deleted directly."
      );
    }

    if (params.generalItemIds?.length || params.donorOfferIds?.length) {
      throw new Error(
        "Item embeddings (generalItemIds, donorOfferIds) cannot be deleted. Only wishlist embeddings can be removed."
      );
    }

    const conditions = buildDeleteConditions({
      embeddingIds: embeddingTargets,
      wishlistIds: wishlistTargets,
    });

    const whereClause =
      conditions.length === 1
        ? conditions[0]
        : joinSql(conditions, Prisma.sql` OR `);

    await db.$executeRaw(
      Prisma.sql`
        DELETE FROM "ItemEmbeddings"
        WHERE ${whereClause}
          AND "wishlistId" IS NOT NULL
      `
    );
  }

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

    static async getTopKMatches(params: SingleQueryParams): Promise<MatchResult[]>;
  static async getTopKMatches(
    params: MultiQueryParams
  ): Promise<MatchResult[][]>;
  static async getTopKMatches(
    params: SingleQueryParams | MultiQueryParams
  ): Promise<MatchResult[] | MatchResult[][]> {
    const { k, distanceCutoff = 0.5, hardCutoff = 0.3 } = params;

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

        const baseFilterConditions: Prisma.Sql[] = [];

        if (metadataFilters.generalItemId !== undefined || metadataFilters.generalItemIds) {
          const generalIds = dedupeNumbers([
            metadataFilters.generalItemId,
            ...(metadataFilters.generalItemIds ?? []),
          ]);
          if (generalIds.length === 1) {
            baseFilterConditions.push(Prisma.sql`emb."generalItemId" = ${generalIds[0]}`);
          } else if (generalIds.length > 1) {
            baseFilterConditions.push(Prisma.sql`emb."generalItemId" = ANY(${generalIds})`);
          }
        }
        if (metadataFilters.wishlistId !== undefined || metadataFilters.wishlistIds) {
          const wishlistIds = dedupeNumbers([
            metadataFilters.wishlistId,
            ...(metadataFilters.wishlistIds ?? []),
          ]);
          if (wishlistIds.length === 1) {
            baseFilterConditions.push(Prisma.sql`emb."wishlistId" = ${wishlistIds[0]}`);
          } else if (wishlistIds.length > 1) {
            baseFilterConditions.push(Prisma.sql`emb."wishlistId" = ANY(${wishlistIds})`);
          }
        }
        if (metadataFilters.donorOfferId !== undefined || metadataFilters.donorOfferIds) {
          const donorOfferIds = dedupeNumbers([
            metadataFilters.donorOfferId,
            ...(metadataFilters.donorOfferIds ?? []),
          ]);
          if (donorOfferIds.length === 1) {
            baseFilterConditions.push(Prisma.sql`emb."donorOfferId" = ${donorOfferIds[0]}`);
          } else if (donorOfferIds.length > 1) {
            baseFilterConditions.push(Prisma.sql`emb."donorOfferId" = ANY(${donorOfferIds})`);
          }
        }

        // Only match general item embeddings (not wishlist embeddings)
        baseFilterConditions.push(Prisma.sql`emb."generalItemId" IS NOT NULL`);

        // Add matchability condition: item must be in matchable donor offer
        baseFilterConditions.push(Prisma.sql`
          EXISTS (
            SELECT 1
            FROM "ItemEmbeddings" item_emb
            INNER JOIN "DonorOffer" donor ON donor."id" = item_emb."donorOfferId"
            WHERE item_emb."generalItemId" = gi."id"
              AND item_emb."donorOfferId" IS NOT NULL
              AND (
                (donor."state" = 'UNFINALIZED' AND (donor."partnerResponseDeadline" IS NULL OR donor."partnerResponseDeadline" > NOW()))
                OR (
                  donor."state" = 'ARCHIVED'
                  AND EXISTS (
                    SELECT 1
                    FROM "LineItem" li
                    LEFT JOIN "Allocation" a ON a."lineItemId" = li."id"
                    WHERE li."generalItemId" = gi."id" AND a."id" IS NULL
                  )
                )
              )
          )
        `);

        const combinedWhereClause = baseFilterConditions.length > 0
          ? Prisma.sql`WHERE ${joinSql(baseFilterConditions, Prisma.sql` AND `)}`
          : Prisma.sql``;

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
          combinedWhereClause,
        ];

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

    static async loadDonorOfferEmbeddings(
    donorOfferId: number,
    cache: EmbeddingCache
  ): Promise<void> {
    const rows = await db.$queryRaw<Array<{
      id: number;
      generalItemId: number | null;
      embedding: string;
      title: string;
      unitType: string | null;
      expirationDate: Date | null;
    }>>`
      SELECT
        emb."id",
        emb."generalItemId",
        emb."embedding"::text as embedding,
        gi."title",
        gi."unitType",
        gi."expirationDate"
      FROM "ItemEmbeddings" emb
      INNER JOIN "GeneralItem" gi ON gi."id" = emb."generalItemId"
      WHERE emb."donorOfferId" = ${donorOfferId}
    `;

    const cached: CachedEmbedding[] = rows.map((row) => ({
      id: row.id,
      generalItemId: row.generalItemId,
      title: row.title,
      unitType: row.unitType ?? undefined,
      embedding: JSON.parse(row.embedding),
      expirationDate: row.expirationDate,
    }));

    cache.set(donorOfferId, cached);
  }

    static async findSimilarFromCache(
    donorOfferId: number,
    query: string,
    cache: EmbeddingCache,
    filters: {
      unitType?: string;
      expirationDate?: Date | null;
      expirationTolerance?: number;
    },
    distanceCutoff = 0.15
  ): Promise<CachedEmbedding | null> {
    const cached = cache.get(donorOfferId);

    if (!cached || cached.length === 0) {
      return null;
    }

    const candidates = cached.filter((item) => {
      if (filters.unitType) {
        const normalizedItemType = item.unitType?.replace(/\s+/g, " ").trim().toLowerCase();
        const normalizedFilterType = filters.unitType.replace(/\s+/g, " ").trim().toLowerCase();
        if (normalizedItemType !== normalizedFilterType) {
          return false;
        }
      }

      if (filters.expirationDate !== undefined) {
        const tolerance = filters.expirationTolerance ?? 1;
        if (!datesWithinTolerance(filters.expirationDate, item.expirationDate, tolerance)) {
          return false;
        }
      }

      return true;
    });

    if (candidates.length === 0) {
      return null;
    }

    const [queryEmbedding] = await embed([query]);

    let bestMatch: CachedEmbedding | null = null;
    let bestDistance = Infinity;

    for (const item of candidates) {
      const distance = calculateCosineDistance(queryEmbedding, item.embedding);
      if (distance < bestDistance && distance <= distanceCutoff) {
        bestDistance = distance;
        bestMatch = item;
      }
    }

    return bestMatch;
  }

}

function calculateCosineDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vector dimensions must match");
  }
  
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < a.length; i++) {
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 1;
  }
  
  const cosineSimilarity = dotProduct / (magnitudeA * magnitudeB);
  
  return 1 - cosineSimilarity;
}

function datesWithinTolerance(
  date1: Date | null,
  date2: Date | null,
  toleranceDays: number
): boolean {
  if (date1 === null && date2 === null) return true;
  if (date1 === null || date2 === null) return false;

  const diffMs = Math.abs(date1.getTime() - date2.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= toleranceDays;
}

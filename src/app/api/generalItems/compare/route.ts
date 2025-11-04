// src/app/api/generalItems/compare/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MatchingService } from "@/services/matchingService";
import { ArgumentError, errorResponse } from "@/util/errors";
import { db } from "@/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = (searchParams.get("title") ?? "").trim();
    const donorOfferIdParam = searchParams.get("donorOfferId");
    const donorOfferId = donorOfferIdParam
      ? Number(donorOfferIdParam)
      : undefined;

    if (!title) {
      throw new ArgumentError("Missing required parameter: title");
    }

    // Base matches (id, title, donorOfferId, distance, similarity, strength handled by service)
    const baseResults = await MatchingService.getTopKMatches({
      query: title,
      k: 4,
      donorOfferId,
    });


    if (baseResults.length === 0) {
      return NextResponse.json({
        queryTitle: title,
        count: 0,
        results: [],
      });
    }

    // Pull the remaining fields from Prisma
    const ids = baseResults
      .map((r) => r.id)
      .filter((id): id is number => typeof id === "number");
    const items = await db.generalItem.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        unitType: true, // maps to unitSize
        initialQuantity: true, // maps to quantity
      },
    });

    const byId = new Map(items.map((i) => [i.id, i]));

    // Merge fields
    const results = baseResults.map((r) => {
      const gi = byId.get(r.id as number);
      return {
        id: r.id,
        title: r.title,
        donorOfferId: r.donorOfferId ?? null,
        distance: r.distance,
        similarity: r.similarity,
        strength: r.strength, // "hard" | "soft" coming from MatchingService
        unitSize: gi?.unitType ?? null,
        quantity: gi?.initialQuantity ?? null,
      };
    });

    return NextResponse.json({
      queryTitle: title,
      count: results.length,
      results,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

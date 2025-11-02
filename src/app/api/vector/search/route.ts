import { NextRequest, NextResponse } from "next/server";
import { MatchingService } from "@/services/matchingService";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") ?? "";
    const kParam = searchParams.get("k");
    const donorOfferIdParam = searchParams.get("donorOfferId");

    if (!query.trim()) {
      return NextResponse.json(
        { error: "Query param 'q' is required." },
        { status: 400 }
      );
    }

    const k = Math.max(1, Math.min(100, Number(kParam ?? 5)));
    const donorOfferId = donorOfferIdParam
      ? Number(donorOfferIdParam)
      : undefined;

    const ids = await MatchingService.getTopKMatches({
      query,
      k,
      donorOfferId,
      distanceCutoff: 0.5,
      hardCutoff: 0.1,
    });

    return NextResponse.json({ ids, k, q: query, donorOfferId });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

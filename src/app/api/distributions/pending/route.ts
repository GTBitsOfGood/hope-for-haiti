import DistributionService from "@/services/distributionService";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ArgumentError } from "@/util/errors";

const searchParamsSchema = z.object({
  term: z.string().optional().nullable(),
  exclude: z.string().optional().nullable(),
});

/**
 * GET /api/distributions/pending
 * Returns all pending distributions, optionally filtered by partner name
 * Query params:
 *   - term: Optional search term to filter by partner name
 *   - exclude: Optional comma-separated list of distribution IDs to exclude
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const parsed = searchParamsSchema.safeParse({
    term: searchParams.get("term"),
    exclude: searchParams.get("exclude"),
  });

  if (!parsed.success) {
    throw new ArgumentError(parsed.error.message);
  }

  // Parse exclude IDs from comma-separated string
  const excludeIds = parsed.data.exclude
    ? parsed.data.exclude.split(",").map((id) => parseInt(id.trim(), 10))
    : undefined;

  const distributions = await DistributionService.getPendingDistributions({
    term: parsed.data.term ?? undefined,
    excludeIds,
  });

  return NextResponse.json({ distributions }, { status: 200 });
}

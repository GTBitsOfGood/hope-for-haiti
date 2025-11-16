import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { isPartner } from "@/lib/userUtils";
import AllocationService from "@/services/allocationService";
import DistributionService from "@/services/distributionService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { tableParamsSchema } from "@/schema/tableParams";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!isPartner(session.user.type)) {
      throw new AuthorizationError("Partner access required");
    }

    const url = new URL(request.url);

    const completedParam = url.searchParams.get("completed");
    const completed = completedParam === "true";

    const parsed = tableParamsSchema.safeParse({
      pageSize: Number(url.searchParams.get("pageSize")),
      page: Number(url.searchParams.get("page")),
      filters: url.searchParams.get("filters"),
    });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const page = parsed.data.page ?? undefined;
    const pageSize = parsed.data.pageSize ?? undefined;
    const filters = parsed.data.filters ?? undefined;

    const partnerId = parseInt(session.user.id);
    const result = await AllocationService.getPartnerAllocations(
      partnerId,
      completed,
      page,
      pageSize,
      filters
    );

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

const postSchema = z.object({
  partnerId: z.number().int().positive(),
  lineItem: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user)) {
      throw new AuthorizationError("Admin access required");
    }

    const body = await request.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    let distribution =
      await DistributionService.getPendingDistributionForPartner(
        parsed.data.partnerId
      );
    const createdNewDistribution = !distribution;
    if (!distribution) {
      distribution = await DistributionService.createDistribution({
        partnerId: parsed.data.partnerId,
        pending: true,
      });
    }

    try {
      const allocation = await AllocationService.createAllocation({
        itemId: parsed.data.lineItem,
        partnerId: parsed.data.partnerId,
        distributionId: distribution!.id,
      });

      return NextResponse.json({ allocation, distribution }, { status: 201 });
    } catch (error) {
      if (createdNewDistribution) {
        // If we created a new distribution and allocation fails, clean up the distribution
        await DistributionService.deleteDistribution(distribution!.id);
      }

      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
}

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { isPartner } from "@/lib/userUtils";
import AllocationService from "@/services/allocationService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { tableParamsSchema } from "@/schema/tableParams";

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

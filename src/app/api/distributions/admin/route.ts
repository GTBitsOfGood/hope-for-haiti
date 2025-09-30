import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { AuthenticationError, AuthorizationError, ArgumentError, errorResponse } from "@/util/errors";
import UserService from "@/services/userService";
import DistributionService from "@/services/distributionService";
import { NextResponse } from "next/server";
import { tableParamsSchema } from "@/schema/tableParams";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const url = new URL(request.url);
    const completed = url.searchParams.get("completed");

    const tableParams = tableParamsSchema.safeParse({
      filters: url.searchParams.get("filters"),
      page: url.searchParams.get("page"),
      pageSize: url.searchParams.get("pageSize"),
    });

    if (!tableParams.success) {
      throw new ArgumentError(tableParams.error.message);
    }

    const { filters, page, pageSize } = tableParams.data;

    if (completed === "true") {
      const signoffs = await DistributionService.getCompletedSignOffs(
        filters ?? undefined,
        page ?? undefined,
        pageSize ?? undefined,
      );
      return NextResponse.json(signoffs);
    }

    const partnerAllocationsWithVisibility = await DistributionService.getPartnerAllocationSummaries(
      filters ?? undefined,
      page ?? undefined,
      pageSize ?? undefined,
    );
    return NextResponse.json(partnerAllocationsWithVisibility);
  } catch (error) {
    return errorResponse(error);
  }
}

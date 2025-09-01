import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { AuthenticationError, AuthorizationError } from "@/util/errors";
import { errorResponse } from "@/util/errors";
import UserService from "@/services/userService";
import DistributionService from "@/services/distributionService";
import { NextResponse } from "next/server";

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

    if (completed === "true") {
      const signoffs = await DistributionService.getCompletedSignOffs();
      return NextResponse.json({ signoffs });
    }

    const partnerAllocationsWithVisibility = await DistributionService.getPartnerAllocationSummaries();
    return NextResponse.json({ data: partnerAllocationsWithVisibility });
  } catch (error) {
    return errorResponse(error);
  }
}

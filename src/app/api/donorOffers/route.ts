import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import DonorOfferService from "@/services/donorOfferService";
import UserService from "@/services/userService";
import {
  AuthenticationError,
  AuthorizationError,
  ArgumentError,
  errorResponse,
} from "@/util/errors";
import { tableParamsSchema } from "@/schema/tableParams";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const parsed = tableParamsSchema.safeParse({
      filters: request.nextUrl.searchParams.get("filters"),
      page: request.nextUrl.searchParams.get("page"),
      pageSize: request.nextUrl.searchParams.get("pageSize"),
    });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { filters, page, pageSize } = parsed.data;

    let result;
    
    if (session.user.type === "PARTNER") {
      result = await DonorOfferService.getPartnerDonorOffers(
        parseInt(session.user.id),
        filters ?? undefined,
        page ?? undefined,
        pageSize ?? undefined,
      );
    } else if (UserService.isStaff(session.user.type)) {
      result = await DonorOfferService.getAdminDonorOffers(
        filters ?? undefined,
        page ?? undefined,
        pageSize ?? undefined,
      );
    } else {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

import { auth } from "@/auth";
import UserService from "@/services/userService";
import { GeneralItemRequestService } from "@/services/generalItemRequestService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { tableParamsSchema } from "@/schema/tableParams";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isPartner(session.user)) {
      throw new AuthorizationError("Partner access required");
    }

    const parsedParams = tableParamsSchema.safeParse({
      filters: request.nextUrl.searchParams.get("filters"),
      page: request.nextUrl.searchParams.get("page"),
      pageSize: request.nextUrl.searchParams.get("pageSize"),
    });

    if (!parsedParams.success) {
      throw new ArgumentError(parsedParams.error.message);
    }

    const { filters, page, pageSize } = parsedParams.data;

    const requests = await GeneralItemRequestService.getRequestsByPartnerId(
      parseInt(session.user.id),
      filters ?? undefined,
      page ?? undefined,
      pageSize ?? undefined
    );

    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

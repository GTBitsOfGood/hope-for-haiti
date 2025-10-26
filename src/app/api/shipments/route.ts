import { auth } from "@/auth";
import { tableParamsSchema } from "@/schema/tableParams";
import { ShippingStatusService } from "@/services/shippingStatusService";
import UserService from "@/services/userService";
import {
  AuthenticationError,
  ArgumentError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const user = session.user;

    const url = new URL(request.url);
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

    if (!UserService.isAdmin(user.type)) {
      throw new AuthorizationError("You are not allowed to view this");
    }

    const result = await ShippingStatusService.getShippingStatuses(
      page,
      pageSize,
      filters
    );
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

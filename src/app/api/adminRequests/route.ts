import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import UserService from "@/services/userService";
import AdminRequestsService from "@/services/adminRequestsService";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
} from "@/util/errors";
import { tableParamsSchema } from "@/schema/tableParams";

const statusSchema = z.enum(["current", "past"]);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (session.user.type === "PARTNER") {
      throw new AuthenticationError("Partners cannot access admin requests");
    }

    UserService.checkPermission(session.user, "requestRead");

    const url = new URL(request.url);

    const parsedStatus = statusSchema.safeParse(url.searchParams.get("status"));
    if (!parsedStatus.success) {
      throw new ArgumentError("Invalid or missing status parameter");
    }

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

    if (parsedStatus.data === "current") {
      const result = await AdminRequestsService.getCurrentRequests(
        filters,
        page,
        pageSize
      );
      return NextResponse.json(result);
    }

    const result = await AdminRequestsService.getPastRequests(
      filters,
      page,
      pageSize
    );
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

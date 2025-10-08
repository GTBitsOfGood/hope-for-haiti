import { auth } from "@/auth";
import { isAdmin } from "@/lib/userUtils";
import { GeneralItemService } from "@/services/generalItemService";
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

    if (!isAdmin(session.user.type)) {
      throw new AuthorizationError(
        "You are not allowed to view unallocated items"
      );
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

    const unallocatedItems = await GeneralItemService.getUnallocatedItems(
      filters ?? undefined,
      page ?? undefined,
      pageSize ?? undefined
    );

    return NextResponse.json(unallocatedItems, {
      status: 200,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

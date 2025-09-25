import { auth } from "@/auth";
import { errorResponse } from "@/util/errors";
import { SignOffService } from "@/services/signOffService";
import { AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import UserService from "@/services/userService";
import { tableParamsSchema } from "@/schema/tableParams";

const paramSchema = z.object({
  partnerId: z.string().transform((val) => {
    const parsed = parseInt(val);
    if (isNaN(parsed)) {
      throw new Error("partnerId must be a valid number");
    }
    return parsed;
  }),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const resolvedParams = await params;
    const parsed = paramSchema.safeParse(resolvedParams);
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const tableParams = tableParamsSchema.safeParse({
      filters: request.nextUrl.searchParams.get("filters"),
      page: request.nextUrl.searchParams.get("page"),
      pageSize: request.nextUrl.searchParams.get("pageSize"),
    });

    if (!tableParams.success) {
      throw new ArgumentError(tableParams.error.message);
    }

    const { filters, page, pageSize } = tableParams.data;

    const signOffs = await SignOffService.getSignOffsByPartner(
      parsed.data.partnerId,
      filters ?? undefined,
      page ?? undefined,
      pageSize ?? undefined,
    );

    return NextResponse.json(signOffs, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

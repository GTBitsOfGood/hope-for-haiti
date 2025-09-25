import { auth } from "@/auth";
import { errorResponse } from "@/util/errors";
import { UnallocatedItemService } from "@/services/unallocatedItemService";
import UserService from "@/services/userService";
import { AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { tableParamsSchema } from "@/schema/tableParams";

const paramSchema = z.object({
  title: z.string(),
  type: z.string(),
  expirationDate: z
    .string()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }),
  unitType: z.string(),
  quantityPerUnit: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().int().positive("Quantity per unit must be a positive integer")),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const url = new URL(req.url);
    const tableParams = tableParamsSchema.safeParse({
      filters: url.searchParams.get("filters"),
      page: url.searchParams.get("page"),
      pageSize: url.searchParams.get("pageSize"),
    });

    if (!tableParams.success) {
      throw new ArgumentError(tableParams.error.message);
    }

    const { filters, page, pageSize } = tableParams.data;

    const parsed = paramSchema.safeParse({
      title: url.searchParams.get("title"),
      type: url.searchParams.get("type"),
      expirationDate: url.searchParams.get("expirationDate"),
      unitType: url.searchParams.get("unitType"),
      quantityPerUnit: url.searchParams.get("quantityPerUnit"),
    });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const result = await UnallocatedItemService.getUnallocatedItemRequests(
      {
        title: parsed.data.title,
        type: parsed.data.type,
        expirationDate: parsed.data.expirationDate,
        unitType: parsed.data.unitType,
        quantityPerUnit: parsed.data.quantityPerUnit,
      },
      filters ?? undefined,
      page ?? undefined,
      pageSize ?? undefined,
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const params = request.nextUrl.searchParams;

    const tableParams = tableParamsSchema.safeParse({
      filters: params.get("filters"),
      page: params.get("page"),
      pageSize: params.get("pageSize"),
    });

    if (!tableParams.success) {
      throw new ArgumentError(tableParams.error.message);
    }

    const { filters, page, pageSize } = tableParams.data;

    const parsed = paramSchema.safeParse({
      title: params.get("title"),
      type: params.get("type"),
      expirationDate: params.get("expirationDate"),
      unitType: params.get("unitType"),
      quantityPerUnit: params.get("quantityPerUnit"),
    });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const result = await UnallocatedItemService.getLineItems(
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

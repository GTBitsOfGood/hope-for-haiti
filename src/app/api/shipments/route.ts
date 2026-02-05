import { auth } from "@/auth";
import { tableParamsSchema } from "@/schema/tableParams";
import { ShippingStatusService } from "@/services/shippingStatusService";
import UserService from "@/services/userService";
import {
  AuthenticationError,
  ArgumentError,
  errorResponse,
  ok,
} from "@/util/errors";
import { $Enums } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchParamSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

const patchBodySchema = z.object({
  status: z.nativeEnum($Enums.ShipmentStatus),
});


export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "shipmentRead");

    const url = new URL(request.url);
    const isCompletedParam = url.searchParams.get("isCompleted");
    const isCompleted =
      isCompletedParam === null
        ? undefined
        : isCompletedParam === "true"
          ? true
          : isCompletedParam === "false"
            ? false
            : undefined;

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

    const result = await ShippingStatusService.getShipments(
      page,
      pageSize,
      filters,
      isCompleted
    );
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "shipmentWrite");

    const params = new URL(request.url).searchParams;
    const parsedParams = patchParamSchema.safeParse({
      id: params.get("id"),
    });
    if (!parsedParams.success) {
      throw new ArgumentError(parsedParams.error.message);
    }

    const body = await request.json();
    const parsedBody = patchBodySchema.safeParse(body);
    if (!parsedBody.success) {
      throw new ArgumentError(parsedBody.error.message);
    }

    await ShippingStatusService.updateShippingStatus({
      id: parsedParams.data.id,
      value: parsedBody.data.status,
    });

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

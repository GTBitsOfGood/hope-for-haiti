import { auth } from "@/auth";
import { tableParamsSchema } from "@/schema/tableParams";
import { ShippingStatusService } from "@/services/shippingStatusService";
import UserService from "@/services/userService";
import {
  AuthenticationError,
  ArgumentError,
  AuthorizationError,
  errorResponse,
  ok,
} from "@/util/errors";
import { $Enums } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchParamSchema = z.object({
  donorShippingNumber: z.string(),
  hfhShippingNumber: z.string(),
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

    const result = await ShippingStatusService.getShipments(
      page,
      pageSize,
      filters
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

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError(
        "Must be an admin to update shipping statuses"
      );
    }

    const params = new URL(request.url).searchParams;
    const paramsResolved = {
      donorShippingNumber: params.get("donorShippingNumber"),
      hfhShippingNumber: params.get("hfhShippingNumber"),
    };
    const parsedParams = patchParamSchema.safeParse(paramsResolved);
    if (!parsedParams.success) {
      throw new ArgumentError(parsedParams.error.message);
    }

    const body = await request.json();
    const parsedBody = patchBodySchema.safeParse(body);
    if (!parsedBody.success) {
      throw new ArgumentError(parsedBody.error.message);
    }

    await ShippingStatusService.updateShippingStatus({
      donorShippingNumber: parsedParams.data.donorShippingNumber,
      hfhShippingNumber: parsedParams.data.hfhShippingNumber,
      value: parsedBody.data.status,
    });

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

import { auth } from "@/auth";
import { errorResponse, ok } from "@/util/errors";
import { ShippingStatusService } from "@/services/shippingStatusService";
import { AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import { ShipmentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import UserService from "@/services/userService";

const updateShippingStatusSchema = z.object({
  donorShippingNumber: z.string(),
  hfhShippingNumber: z.string(),
  value: z.nativeEnum(ShipmentStatus),
});

export async function GET(
  _: NextRequest,
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

    const partnerId = parseInt((await params).partnerId);
    if (isNaN(partnerId)) {
      throw new ArgumentError("Invalid partner ID");
    }

    const result = await ShippingStatusService.getPartnerShippingStatuses(partnerId);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const url = new URL(req.url);
    const searchParams = {
      donorShippingNumber: url.searchParams.get("donorShippingNumber"),
      hfhShippingNumber: url.searchParams.get("hfhShippingNumber"),
      value: url.searchParams.get("value"),
    };

    const parsed = updateShippingStatusSchema.safeParse(searchParams);
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    await ShippingStatusService.updateShippingStatus(parsed.data);

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

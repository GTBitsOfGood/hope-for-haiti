import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import DonorOfferService from "@/services/donorOfferService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
  ok,
} from "@/util/errors";
import { tableParamsSchema } from "@/schema/tableParams";

const paramSchema = z.object({
  donorOfferId: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().int().positive("Donor offer ID must be a positive integer")),
});

const postBodySchema = z.object({
  requests: z.array(z.object({
    donorOfferItemId: z.number(),
    title: z.string(),
    type: z.string(),
    expiration: z.string().nullable(),
    quantity: z.number(),
    unitSize: z.number(),
    requestId: z.number().nullable(),
    quantityRequested: z.number(),
    comments: z.string().nullable(),
    priority: z.string().nullable(),
  })),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ donorOfferId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const { donorOfferId } = await params;
    const parsed = paramSchema.safeParse({ donorOfferId });
    
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

    let result;
    
    if (session.user.type === "PARTNER") {
      result = await DonorOfferService.getPartnerDonorOfferDetails(
        parsed.data.donorOfferId,
        session.user.id,
        filters ?? undefined,
        page ?? undefined,
        pageSize ?? undefined,
      );
    } else if (UserService.isStaff(session.user.type)) {
      result = await DonorOfferService.getAdminDonorOfferDetails(
        parsed.data.donorOfferId,
        filters ?? undefined,
        page ?? undefined,
        pageSize ?? undefined,
      );
    } else {
      throw new AuthorizationError("Unauthorized user type");
    }

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (session.user.type !== "PARTNER") {
      throw new AuthorizationError("Must be PARTNER");
    }

    const rawBody = await request.json();
    const parsed = postBodySchema.safeParse(rawBody);
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    await DonorOfferService.createDonorOfferRequests(parsed.data.requests, parseInt(session.user.id));

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

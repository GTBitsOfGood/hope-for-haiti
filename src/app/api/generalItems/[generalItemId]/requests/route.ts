import { auth } from "@/auth";
import { isPartner } from "@/lib/userUtils";
import { GeneralItemRequestService } from "@/services/generalItemRequestService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { $Enums } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { tableParamsSchema } from "@/schema/tableParams";

const createSchema = z.object({
  generalItemId: z.number().int().positive(),
  partnerId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  comments: z.string().max(255).optional(),
  priority: z
    .enum(Object.values($Enums.RequestPriority) as [string, ...string[]])
    .transform((val) => val as $Enums.RequestPriority),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ generalItemId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const { generalItemId } = await params;
    const parsedParams = tableParamsSchema.safeParse({
      filters: request.nextUrl.searchParams.get("filters"),
      page: request.nextUrl.searchParams.get("page"),
      pageSize: request.nextUrl.searchParams.get("pageSize"),
    });

    if (!parsedParams.success) {
      throw new ArgumentError(parsedParams.error.message);
    }

    const { filters, page, pageSize } = parsedParams.data;

    const requests = await GeneralItemRequestService.getRequestsByGeneralItemId(
      parseInt(generalItemId),
      filters ?? undefined,
      page ?? undefined,
      pageSize ?? undefined
    );

    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ generalItemId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!isPartner(session.user.type)) {
      throw new AuthorizationError("Partner access required");
    }

    const { generalItemId } = await params;

    const formData = await request.formData();
 
    const parsedData = createSchema.safeParse({
      ...formData,
      generalItemId: parseInt(generalItemId),
      partnerId: session.user.id,
    });

    if (!parsedData.success) {
      throw new Error(parsedData.error.message);
    }

    const itemRequest = await GeneralItemRequestService.createRequest(
      parsedData.data
    );

    return NextResponse.json(itemRequest, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}


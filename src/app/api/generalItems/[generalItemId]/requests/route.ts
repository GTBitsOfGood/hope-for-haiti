import { auth } from "@/auth";
import { isPartner } from "@/lib/userUtils";
import { GeneralItemRequestService } from "@/services/generalItemRequestService";
import {
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { $Enums } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

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
  _: NextRequest,
  { params }: { params: Promise<{ generalItemId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const { generalItemId } = await params;

    const requests = await GeneralItemRequestService.getRequestsByGeneralItemId(
      parseInt(generalItemId)
    );

    return new Response(JSON.stringify(requests), { status: 200 });
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

    return new Response(JSON.stringify(itemRequest), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

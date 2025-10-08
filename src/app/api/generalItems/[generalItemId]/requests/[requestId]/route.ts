import { auth } from "@/auth";
import { isAdmin } from "@/lib/userUtils";
import { GeneralItemRequestService } from "@/services/generalItemRequestService";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
} from "@/util/errors";
import { $Enums } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  quantity: z.number().min(1).optional(),
  priority: z
    .enum(Object.values($Enums.RequestPriority) as [string, ...string[]])
    .transform((val) => val as $Enums.RequestPriority)
    .optional(),
  comments: z.string().max(500).optional(),
});

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!isAdmin(session.user.type)) {
      const existingRequest = await GeneralItemRequestService.getById(
        Number((await params).requestId)
      );

      if (!existingRequest) {
        throw new ArgumentError("Request not found");
      }

      if (Number(session.user.id) !== existingRequest.partnerId) {
        throw new ArgumentError("Request not found"); // Hide existence of request
      }
    }

    const { requestId } = await params;

    await GeneralItemRequestService.deleteRequest(Number(requestId));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const { requestId } = await params;

    const existingRequest = await GeneralItemRequestService.getById(
      Number(requestId)
    );
    
    if (!existingRequest) {
      throw new ArgumentError("Request not found");
    }

    if (
      Number(session.user.id) !== existingRequest.partnerId &&
      !isAdmin(session.user.type)
    ) {
      throw new ArgumentError("Request not found"); // Hide existence of request
    }

    const form = await request.formData();
    const formData = {
      quantity: form.get("quantity") ? Number(form.get("quantity")) : undefined,
      priority: form.get("priority") ? String(form.get("priority")) : undefined,
      comments: form.get("comments") ? String(form.get("comments")) : undefined,
    };

    const parsed = patchSchema.safeParse(formData);
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const updatedRequest = await GeneralItemRequestService.updateRequest(
      Number(requestId),
      parsed.data
    );

    return NextResponse.json(updatedRequest, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

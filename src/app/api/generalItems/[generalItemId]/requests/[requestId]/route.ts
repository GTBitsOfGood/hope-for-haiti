import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import DonorOfferService from "@/services/donorOfferService";
import { GeneralItemRequestService } from "@/services/generalItemRequestService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  errorResponse,
  ok,
} from "@/util/errors";
import { RequestPriority } from "@prisma/client";

const paramSchema = z.object({
  generalItemId: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(
      z.number().int().positive("General item ID must be a positive integer")
    ),
  requestId: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().int().positive("Request ID must be a positive integer")),
});

const updateRequestSchema = z.object({
  finalQuantity: z.number().int().min(0, "Final quantity must be non-negative"),
});

const partnerUpdateSchema = z.object({
  quantity: z.number().int().positive("Quantity must be positive"),
  priority: z.nativeEnum(RequestPriority),
  comments: z.string(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ generalItemId: string; requestId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    const { generalItemId, requestId } = await params;
    const parsed = paramSchema.safeParse({ generalItemId, requestId });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const contentType = req.headers.get("content-type");
    const isFormData = contentType?.includes("multipart/form-data");

    if (UserService.isPartner(session.user)) {
      if (!isFormData) {
        throw new ArgumentError("Partners must submit FormData");
      }

      const formData = await req.formData();
      const updateData = {
        quantity: Number(formData.get("quantity")),
        priority: formData.get("priority") as RequestPriority,
        comments: formData.get("comments") as string,
      };

      const updateParsed = partnerUpdateSchema.safeParse(updateData);

      if (!updateParsed.success) {
        throw new ArgumentError(updateParsed.error.message);
      }

      await GeneralItemRequestService.updateRequest(
        parsed.data.requestId,
        updateParsed.data
      );

      return NextResponse.json(ok());
    } else {
      UserService.checkPermission(session.user, "requestWrite");
      if (isFormData) {
        throw new ArgumentError("Staff must submit JSON");
      }
      const body = await req.json();

      const updateParsed = updateRequestSchema.safeParse({
        finalQuantity: Number(body.finalQuantity),
      });

      if (!updateParsed.success) {
        throw new ArgumentError(updateParsed.error.message);
      }

      await DonorOfferService.updateRequestFinalQuantity(
        parsed.data.requestId,
        updateParsed.data.finalQuantity
      );

      return NextResponse.json(ok());
    }
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ generalItemId: string; requestId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    UserService.checkPermission(session.user, "requestWrite");

    const { generalItemId, requestId } = await params;
    const parsed = paramSchema.safeParse({ generalItemId, requestId });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    // TODO: Implement delete request logic
    // await DonorOfferService.deleteRequest(parsed.data.requestId);

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

import { auth } from "@/auth";
import { GeneralItemService } from "@/services/generalItemService";
import UserService from "@/services/userService";
import {
  AuthorizationError,
  AuthenticationError,
  errorResponse,
  ok,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  type: z.string().min(1).max(255).optional(),
  expirationDate: z.coerce.date().optional(),
  unitType: z.string().min(1).max(255).optional(),
  quantityPerUnit: z.number().int().positive().optional(),
  initialQuantity: z.number().int().min(0).optional(),
  requestQuantity: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ generalItemId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("You are not allowed to modify items");
    }

    const { generalItemId } = await params;

    const form = await request.formData();
    const obj = {
      title: form.get("title") ?? (undefined as string | undefined),
      type: form.get("type") ?? (undefined as string | undefined),
      expirationDate:
        form.get("expirationDate") ?? (undefined as string | undefined),
      unitType: form.get("unitType") ?? (undefined as string | undefined),
      quantityPerUnit: form.get("quantityPerUnit")
        ? Number(form.get("quantityPerUnit"))
        : undefined,
      initialQuantity: form.get("initialQuantity")
        ? Number(form.get("initialQuantity"))
        : undefined,
      requestQuantity: form.get("requestQuantity")
        ? Number(form.get("requestQuantity"))
        : undefined,
    };
    const parsed = patchSchema.safeParse(obj);
    if (!parsed.success) {
      throw new Error(`Invalid request data: ${parsed.error.message}`);
    }

    const updatedItem = await GeneralItemService.updateGeneralItem(
      Number(generalItemId),
      parsed.data
    );

    return new NextResponse(JSON.stringify(updatedItem), {
      status: 200,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ generalItemId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("You are not allowed to delete items");
    }

    const { generalItemId } = await params;

    await GeneralItemService.deleteGeneralItem(Number(generalItemId));

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

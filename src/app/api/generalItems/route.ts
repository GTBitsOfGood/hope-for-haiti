import { auth } from "@/auth";
import { GeneralItemService } from "@/services/generalItemService";
import { singleLineItemSchema } from "@/services/lineItemService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const postSchema = z.object({
  donorOfferId: z.number().int().positive(),
  title: z.string().min(1).max(255),
  type: z.string().min(1).max(255),
  expirationDate: z
    .string()
    .transform((date) => new Date(date))
    .optional(),
  unitType: z.string().min(1).max(255),
  quantityPerUnit: z.number().int().positive(),
  initialQuantity: z.number().int().min(0),
  requestQuantity: z.number().int().min(0).optional(),
  lineItem: z.array(singleLineItemSchema).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError(
        "You are not allowed to create donor offers"
      );
    }

    const form = await request.formData();
    const obj = {
      donorOfferId: Number(form.get("donorOfferId")),
      title: form.get("title") as string,
      type: form.get("type") as string,
      expirationDate:
        form.get("expirationDate") ?? (undefined as string | undefined),
      unitType: form.get("unitType") as string,
      quantityPerUnit: Number(form.get("quantityPerUnit")),
      initialQuantity: Number(form.get("initialQuantity")),
      requestQuantity: form.get("requestQuantity")
        ? Number(form.get("requestQuantity"))
        : undefined,
      lineItem: form.get("lineItem")
        ? JSON.parse(form.get("lineItem") as string)
        : undefined,
    };
    const parsed = postSchema.safeParse(obj);

    if (!parsed.success) throw new ArgumentError(parsed.error.message);

    const data = parsed.data;

    const createdItem = await GeneralItemService.createGeneralItem(data);

    return NextResponse.json(createdItem, {
      status: 201,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

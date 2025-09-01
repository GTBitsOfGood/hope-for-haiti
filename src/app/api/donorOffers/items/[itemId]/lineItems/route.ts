import { NextRequest } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import DonorOfferService from "@/services/donorOfferService";
import UserService from "@/services/userService";
import {
  ArgumentError,
  AuthenticationError,
  AuthorizationError,
  errorResponse,
} from "@/util/errors";

const paramSchema = z.object({
  itemId: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().int().positive("Item ID must be a positive integer")),
});

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isStaff(session.user.type)) {
      throw new AuthorizationError("Must be STAFF, ADMIN, or SUPER_ADMIN");
    }

    const { itemId } = await params;
    const parsed = paramSchema.safeParse({ itemId });
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const result = await DonorOfferService.getItemLineItems(parsed.data.itemId);
    
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

import { auth } from "@/auth";
import { errorResponse, ok } from "@/util/errors";
import { UnallocatedItemService } from "@/services/unallocatedItemService";
import UserService from "@/services/userService";
import { AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import { NextRequest } from "next/server";
import { z } from "zod";

const paramSchema = z.object({
  itemId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive("Item ID must be a positive integer")),
});

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Must be ADMIN or SUPER_ADMIN");
    }

    const { itemId } = await params;
    const parsed = paramSchema.safeParse({ itemId: itemId });
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    await UnallocatedItemService.deleteItem(parsed.data.itemId);

    return ok();
  } catch (error) {
    return errorResponse(error);
  }
}

import { auth } from "@/auth";
import { db } from "@/db";
import {
  argumentError,
  authenticationError,
  authorizationError,
  notFoundError,
  ok,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { z } from "zod";
import { zfd } from "zod-form-data";

const schema = zfd.formData({
  unallocatedItemId: zfd.numeric(z.number().int()),
  //   priority: zfd.numeric(),        Uncomment when priority is added to the schema
  quantity: zfd.numeric(z.number().int().min(1)), // Requesting 0 items would be stupid
  comment: zfd.text(),
});

/**
 * Handles POST requests to create a new unallocated item request.
 * Uses form data unallocatedItemId, quantity, and comment.
 * @param req - the incoming request
 * @returns 200 if the request is successful
 * @returns 400 if the form data is invalid or there are not enough items for the request
 * @returns 401 if the session is invalid
 * @returns 403 if the user type isn't a partner
 * @returns 404 if the unallocated item is not found
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return authenticationError("Session required");
  if (!session?.user) return authenticationError("User not found");
  if (session.user.type !== UserType.PARTNER)
    return authorizationError("Unauthorized");

  const parsed = schema.safeParse(await req.formData());
  if (!parsed.success) return argumentError("Invalid form data");
  //   const { unallocatedItemId, priority, quantity, comment } = parsed.data;
  const { unallocatedItemId, quantity, comment } = parsed.data;

  // Find unallocated item by id
  const unallocatedItem = await db.item.findUnique({
    where: { id: unallocatedItemId },
  });
  if (!unallocatedItem) return notFoundError("Unallocated item not found");

  // Check if there are enough items to request
  if (quantity > unallocatedItem.quantity)
    return argumentError("Not enough items for request");

  // Create unallocated item request
  db.unallocatedItemRequest.create({
    data: {
      itemId: unallocatedItemId,
      partnerId: parseInt(session.user.id),
      quantity: quantity,
      comments: comment,
    },
  });

  return ok();
}

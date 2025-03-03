/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth } from "@/auth";
import { db } from "@/db";
import {
  argumentError,
  authenticationError,
  authorizationError,
  ok,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { z } from "zod";
import { zfd } from "zod-form-data";

const schema = zfd.formData({
  title: zfd.text(),
  category: zfd.text(),
  expirationDate: z.coerce.date().optional(),
  unitSize: zfd.numeric(z.number().int()),
  //   priority: zfd.numeric(),        Uncomment when priority is added to the schema
  quantity: zfd.numeric(z.number().int().min(1)), // Requesting 0 items would be stupid
  comments: zfd.text(),
});

/**
 * Handles POST requests to create a new unallocated item request.
 * Uses form data unallocatedItemId, quantity, and comment.
 * @param req - the incoming request
 * @returns 200 if the request is successful
 * @returns 400 if the form data is invalid or there are not enough items for the request
 * @returns 401 if the session is invalid
 * @returns 403 if the user type isn't a partner
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return authenticationError("Session required");
  if (!session?.user) return authenticationError("User not found");
  if (session.user.type !== UserType.PARTNER)
    return authorizationError("Unauthorized");

  const parsed = schema.safeParse(await req.formData());
  if (!parsed.success) return argumentError("Invalid form data");
  const { title, category, expirationDate, unitSize, quantity, comments } =
    parsed.data;

  db.unallocatedItemRequest.create({
    data: {
      title,
      category,
      expirationDate,
      unitSize,
      quantity,
      comments,
      partnerId: parseInt(session.user.id),
    },
  });

  return ok();
}

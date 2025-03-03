import { auth } from "@/auth";
import { db } from "@/db";
import {
  argumentError,
  authenticationError,
  authorizationError,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zfd } from "zod-form-data";

const AUTHORIZED_USER_TYPES = [
  UserType.ADMIN,
  UserType.SUPER_ADMIN,
] as UserType[];

const SingleItemSchema = z.object({
  title: zfd.text(),
  category: zfd.text(),
  quantity: zfd.numeric(z.number().int().min(0)),
  expirationDate: z.coerce.date().optional(),
  unitSize: zfd.numeric(z.number().int().min(0)),
  unitType: zfd.text(),
  datePosted: z.coerce.date(),
  lotNumber: zfd.numeric(z.number().int().min(0)),
  palletNumber: zfd.numeric(z.number().int().min(0)),
  boxNumber: zfd.numeric(z.number().int().min(0)),
  donorName: zfd.text(),
  unitPrice: zfd.numeric(z.number().min(0)),
  maxRequestLimit: zfd.text(),
  visible: zfd.checkbox(),
});

const ItemsFormSchema = z.array(SingleItemSchema);

/**
 * Bulk create items in the Items database.
 * @param request With the body of a JSON array of items, refer to ItemsFormSchema for the structure.
 * @returns 400 if invalid form data
 * @returns 401 if session is invalid
 * @returns 403 if session is not ADMIN or SUPER_ADMIN
 * @returns 200 with the created items
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return authenticationError("Session required");
  }
  if (!session?.user) {
    return authenticationError("Session required");
  }

  if (!AUTHORIZED_USER_TYPES.includes(session.user.type)) {
    return authorizationError("Session required");
  }

  const data = await request.json();
  const dataItems = data.items;
  const parsed = ItemsFormSchema.safeParse(dataItems);
  if (!parsed.success) {
    return argumentError("Invalid form data");
  }
  const items = parsed.data;
  await db.item.createMany({
    data: items,
  });

  return NextResponse.json(items);
}

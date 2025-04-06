import {
  authenticationError,
  authorizationError,
  argumentError,
} from "@/util/responses";
import { auth } from "@/auth";
import { db } from "@/db";
import { NextResponse, NextRequest } from "next/server";
import { UserType } from "@prisma/client";
import { ItemFormSchema } from "@/schema/itemForm";

const AUTHORIZED_USER_TYPES = [
  UserType.ADMIN,
  UserType.SUPER_ADMIN,
] as UserType[];

/**
 * Creates a new item in the Items database.
 * Parameters are passed as form data.
 * @params title: Title of the item
 * @params category: Category of the item
 * @params quantity: Quantity of the item
 * @params expiration: Expiration date of the item
 * @params unitSize: Size per unit of the item
 * @params unitType: Type of unit of the item
 * @params datePosted: Date the item was posted to the database
 * @params lotNumber: Lot number of the item
 * @params donorName: Name of the donor of the item
 * @params unitPrice: Price per unit of the item
 * @params maxRequestLimit: Maximum number of requests allowed for the item
 * @returns 401 if the request is not authenticated
 * @returns 403 if the user is not authorized to view the partner details
 * @returns 400 if the form data is invalid
 * @returns 200 and the contents of the created item
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");
  if (!AUTHORIZED_USER_TYPES.includes(session.user.type)) {
    return authorizationError("You are not allowed to add this record");
  }
  const validatedForm = ItemFormSchema.safeParse(await request.formData());

  if (!validatedForm.success) {
    return argumentError("Invalid form data");
  }

  const createdItem = await db.item.create({
    data: {
      ...validatedForm.data,
    },
  });

  return NextResponse.json(createdItem);
}

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");
  if (!AUTHORIZED_USER_TYPES.includes(session.user.type)) {
    return authorizationError("You are not allowed to view this");
  }

  const items = await db.item.findMany();
  return NextResponse.json(items);
}

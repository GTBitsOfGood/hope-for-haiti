import {
  authenticationError,
  authorizationError,
  argumentError,
} from "@/util/responses";
import { auth } from "@/auth";
import { db } from "@/db";
import { NextResponse, NextRequest } from "next/server";
import { UserType } from "@prisma/client";
import { z } from "zod";
import { zfd } from "zod-form-data";

const AUTHORIZED_USER_TYPES = [
  UserType.ADMIN,
  UserType.SUPER_ADMIN,
] as UserType[];

const ItemFormSchema = zfd.formData({
  title: zfd.text(),
  category: zfd.text(),
  quantity: zfd.numeric(z.number().int().min(0)),
  expiration: z.coerce.date(),
  unitSize: zfd.numeric(z.number().int().min(0)),
  datePosted: z.coerce.date(),
  lotNumber: zfd.numeric(z.number().int().min(0)),
  donorName: zfd.text(),
  unitPrice: zfd.numeric(z.number().min(0)),
});

interface ItemResponse {
  title: string;
  category: string;
  quantity: number;
  expirationDate: Date;
  unitSize: number;
  datePosted: Date;
  lotNumber: number;
  donorName: string;
  unitPrice: number;
  unitType: string;
  maxRequestLimit: string;
}

/**
 * Creates a new item in the Items database.
 * Parameters are passed as form data.
 * @params title: Title of the item
 * @params category: Category of the item
 * @params quantity: Quantity of the item
 * @params expiration: Expiration date of the item
 * @params unitSize: Size per unit of the item
 * @params datePosted: Date the item was posted to the database
 * @params lotNumber: Lot number of the item
 * @params donorName: Name of the donor of the item
 * @params unitPrice: Price per unit of the item
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

  if (!validatedForm.success) return argumentError("Invalid form data");
  const itemData = {
    ...validatedForm.data,
    expirationDate: validatedForm.data.expiration,
    expiration: undefined,
    unitType: "",
    maxRequestLimit: "",
  }; //rename expiration field to expirationDate so it matches the schema

  const createdItem = await db.item.create({
    data: itemData,
  });
  console.log(createdItem);

  return NextResponse.json(createdItem as ItemResponse);
}

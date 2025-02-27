import { auth } from "@/auth";
import { db } from "@/db";
import { authenticationError, authorizationError, ok } from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import { zfd } from "zod-form-data";

const AUTHORIZED_USER_TYPES = [
  UserType.ADMIN,
  UserType.SUPER_ADMIN,
] as UserType[];

const SingleItemSchema = zfd.formData({
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

const ItemsFormSchema = zfd.formData({
  items: z.array(SingleItemSchema),
});

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

  const formData = await request.formData();
  const parseResult = ItemsFormSchema.safeParse(formData);
  if (!parseResult.success) {
    return authorizationError("Invalid form data");
  }
  const { items } = parseResult.data;
  db.item.createMany({
    data: items,
  });

  return ok();
}

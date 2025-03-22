// POST
import { NextRequest, NextResponse } from "next/server";
import { zfd } from "zod-form-data";
import { z } from "zod";
import { db } from "@/db";
import { auth } from "@/auth";
import {
  authenticationError,
  argumentError,
  notFoundError,
} from "@/util/responses";

const AllocationSchema = zfd.formData({
  unallocatedItemRequestId: zfd.numeric(z.number().int()),
  title: zfd.text(z.string().nonempty()),
  type: zfd.text(z.string().nonempty()),
  expiration: zfd.text(z.string().nonempty()),
  unitSize: zfd.numeric(z.number().int()),
  donorName: zfd.text(z.string().nonempty()),
  lotNumber: zfd.numeric(z.number().int()),
  palletNumber: zfd.numeric(z.number().int()),
  boxNumber: zfd.numeric(z.number().int()),
  quantity: zfd.numeric(z.number().int().positive()),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return authenticationError("Session required");
  }

  const formData = await req.formData();
  const parsedData = AllocationSchema.safeParse(formData);
  if (!parsedData.success) {
    return argumentError("Invalid form data");
  }

  const {
    unallocatedItemRequestId,
    title,
    type,
    expiration,
    unitSize,
    donorName,
    lotNumber,
    palletNumber,
    boxNumber,
    quantity,
  } = parsedData.data;
  const item = await db.item.findFirst({
    where: {
      title,
      type,
      expirationDate: new Date(expiration),
      unitSize,
      donorName,
      lotNumber,
      palletNumber,
      boxNumber,
    },
  });
  if (!item) {
    return notFoundError("No matching item found");
  }

const newAllocation = await db.unallocatedItemRequestAllocation.create({
    data: {
      quantity,
      unallocatedItemRequest: {
        connect: { id: unallocatedItemRequestId },
      },
      unallocatedItem: {
        connect: { id: item.id },
      },
    },
  });
  

  return NextResponse.json(newAllocation);
}

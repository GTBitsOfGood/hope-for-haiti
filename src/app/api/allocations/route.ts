import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  authenticationError,
  argumentError,
  authorizationError,
  notFoundError,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { editAllocationFormSchema } from "@/schema/unAllocatedItemRequestForm";

/**
 * POST: Create an UnallocatedItemRequestAllocation.
 * Accepts form data to match an existing Item and allocate it to an unallocated item request.
 *
 * @params unallocatedItemRequestId ID of the UnallocatedItemRequest
 * @params title Item title to match
 * @params type Item type to match
 * @params expiration Item expiration to match
 * @params unitSize Unit size to match
 * @params donorName Donor name of item to match
 * @params lotNumber Lot number to match
 * @params palletNumber Pallet number to match
 * @params boxNumber Box number to match
 * @params quantity Quantity to allocate
 *
 * @returns 400 if any field is missing or invalid
 * @returns 404 if no item is found with matching fields
 * @returns 200 and the created allocation if successful
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");
  if (
    session.user.type !== UserType.STAFF &&
    session.user.type !== UserType.ADMIN &&
    session.user.type !== UserType.SUPER_ADMIN
  ) {
    return authorizationError("Unauthorized");
  }

  //parse form data
  const form = await request.formData();
  const unallocatedItemRequestId = form.get("unallocatedItemRequestId");
  const title = form.get("title");
  const type = form.get("type");
  const expiration = form.get("expiration");
  const unitSize = form.get("unitSize");
  const donorName = form.get("donorName");
  const lotNumber = form.get("lotNumber");
  const palletNumber = form.get("palletNumber");
  const boxNumber = form.get("boxNumber");
  const quantity = form.get("quantity");

  //validate required fields
  if (
    !unallocatedItemRequestId ||
    !title ||
    !type ||
    !expiration ||
    !unitSize ||
    !donorName ||
    !lotNumber ||
    !palletNumber ||
    !boxNumber ||
    !quantity
  ) {
    return argumentError("Missing one or more required fields.");
  }

  //parse numbers from form values
  const parsedUnitSize = parseInt(unitSize.toString());
  const parsedLot = parseInt(lotNumber.toString());
  const parsedPallet = parseInt(palletNumber.toString());
  const parsedBox = parseInt(boxNumber.toString());
  const parsedQuantity = parseInt(quantity.toString());
  const parsedUnallocatedId = parseInt(unallocatedItemRequestId.toString());
  const parsedExpiration = new Date(expiration.toString());

  //invalid number values
  if (
    isNaN(parsedUnitSize) ||
    isNaN(parsedLot) ||
    isNaN(parsedPallet) ||
    isNaN(parsedBox) ||
    isNaN(parsedQuantity) ||
    isNaN(parsedUnallocatedId)
  ) {
    return argumentError("Invalid number value in form data.");
  }

  //search the database for a matching item
  const item = await db.item.findFirst({
    where: {
      title: title.toString(),
      type: type.toString(),
      expirationDate: parsedExpiration,
      unitSize: parsedUnitSize,
      donorName: donorName.toString(),
      lotNumber: parsedLot,
      palletNumber: parsedPallet,
      boxNumber: parsedBox,
    },
  });

  if (!item) {
    console.warn("[POST /api/allocations] No matching item found");
    return notFoundError("Item not found with the specified attributes.");
  }

  //create allocation
  const allocation = await db.unallocatedItemRequestAllocation.create({
    data: {
      unallocatedItemRequestId: parsedUnallocatedId,
      itemId: item.id,
      quantity: parsedQuantity,
    },
  });

  return NextResponse.json({ message: "Allocation created", allocation });
}

/**
 * Editting an existing unallocated item request allocation.
 * @param req
 * @returns 200 on success
 * @returns 400 if any field is missing or invalid
 * @returns 404 if no item is found with matching fields
 * @returns 403 if user is not authorized
 * @returns 401 if user is not authenticated
 */
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) return authenticationError("Session required");
  if (!session?.user) return authenticationError("User not found");

  if (
    session.user.type !== UserType.STAFF &&
    session.user.type !== UserType.ADMIN &&
    session.user.type !== UserType.SUPER_ADMIN
  ) {
    return authorizationError("Unauthorized");
  }

  // Handle PUT request logic here
  const form = await request.formData();
  const parsedForm = editAllocationFormSchema.safeParse(form);
  if (!parsedForm.success) {
    return argumentError("Invalid form data: " + parsedForm.error.format());
  }

  const {
    allocationId,
    title,
    type,
    expiration,
    unitSize,
    donorName,
    lotNumber,
    palletNumber,
    boxNumber,
    quantity,
  } = parsedForm.data;

  const allocation = await db.unallocatedItemRequestAllocation.findUnique({
    where: {
      id: allocationId,
    },
    include: {
      unallocatedItemRequest: true,
    },
  });
  if (!allocation) {
    return notFoundError("Allocation not found");
  }

  // Find the item
  const item = await db.item.findFirst({
    where: {
      title,
      type,
      expirationDate: expiration,
      unitSize,
      donorName,
      lotNumber,
      palletNumber,
      boxNumber,
    },
  });

  if (!item) {
    return notFoundError("Item not found with the specified attributes.");
  }

  // Check if there are enough items in the inventory
  const totalAllocated = await db.unallocatedItemRequestAllocation.aggregate({
    _sum: {
      quantity: true,
    },
    where: {
      itemId: item.id,
      NOT: {
        id: allocationId,
      },
    },
  });
  if (
    totalAllocated._sum.quantity &&
    item.quantity - totalAllocated._sum.quantity < quantity
  ) {
    return argumentError(
      "Not enough items in inventory to fulfill the allocation request."
    );
  }

  // Update the allocation
  const updatedAllocation = await db.unallocatedItemRequestAllocation.update({
    where: {
      id: allocationId,
    },
    data: {
      itemId: item.id,
      quantity: quantity,
    },
  });
  if (!updatedAllocation) {
    return notFoundError("Allocation not found");
  }

  // Update the quantity for unallocated item request
  // const updatedUnallocatedItemRequest = await db.unallocatedItemRequest.update({
  //   where: {
  //     id: allocation.unallocatedItemRequestId,
  //   },
  //   data: {
  //     quantity: {
  //       increment: quantity,
  //     },
  //   },
  // });

  return NextResponse.json({
    message: "Allocation request modified",
    unallocatedItemRequestAllocation: updatedAllocation,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import UserService from "@/services/userService";
import { ItemPriceService } from "@/services/itemPriceService";
import { ArgumentError, AuthenticationError, errorResponse } from "@/util/errors";
import { MAX_INT32_ID, parsePositivePriceId } from "@/util/itemPrice";

function parseId(value: string): number {
  const id = parsePositivePriceId(value);
  if (id === null) throw new ArgumentError("Item price ID must be a positive 32-bit integer.");
  return id;
}

async function authorize() {
  const session = await auth();
  if (!session?.user) throw new AuthenticationError("Session required");
  UserService.checkStaff(session.user);
  UserService.checkPermission(session.user, "offerWrite");
  const userId = Number(session.user.id);
  if (!Number.isSafeInteger(userId) || userId <= 0 || userId > MAX_INT32_ID) throw new AuthenticationError("Invalid user session");
  return userId;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ itemPriceId: string }> }) {
  try {
    const userId = await authorize();
    const { itemPriceId } = await context.params;
    let body: unknown;
    try { body = await request.json(); } catch { throw new ArgumentError("Request body must be valid JSON."); }
    return NextResponse.json(await ItemPriceService.update(parseId(itemPriceId), body, userId));
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ itemPriceId: string }> }) {
  try {
    await authorize();
    const { itemPriceId } = await context.params;
    await ItemPriceService.remove(parseId(itemPriceId));
    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (error) { return errorResponse(error); }
}

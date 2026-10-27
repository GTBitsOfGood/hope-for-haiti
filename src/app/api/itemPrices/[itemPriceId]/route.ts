import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ItemPriceService } from "@/services/itemPriceService";
import { ArgumentError, errorResponse } from "@/util/errors";
import { parsePositivePriceId } from "@/util/itemPrice";
import { authorizeItemPriceUser } from "../authorize";

function parseId(value: string): number {
  const id = parsePositivePriceId(value);
  if (id === null) throw new ArgumentError("Item price ID must be a positive 32-bit integer.");
  return id;
}

async function authorize() {
  const session = await auth();
  return authorizeItemPriceUser(session?.user);
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

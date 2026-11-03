import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ItemPriceService } from "@/services/itemPriceService";
import { ArgumentError, errorResponse } from "@/util/errors";
import { parseItemPriceListQuery } from "@/util/itemPrice";
import { authorizeItemPriceUser } from "./authorize";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    authorizeItemPriceUser(session?.user);
    let query;
    try {
      query = parseItemPriceListQuery(request.nextUrl.searchParams);
    } catch (error) {
      throw new ArgumentError(error instanceof Error ? error.message : "Invalid item price query.");
    }
    return NextResponse.json(await ItemPriceService.list(query));
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = authorizeItemPriceUser(session?.user);
    let body: unknown;
    try { body = await request.json(); } catch { throw new ArgumentError("Request body must be valid JSON."); }
    return NextResponse.json(await ItemPriceService.create(body, userId), { status: 201 });
  } catch (error) { return errorResponse(error); }
}


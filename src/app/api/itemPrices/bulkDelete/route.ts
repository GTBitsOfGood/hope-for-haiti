import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ItemPriceService } from "@/services/itemPriceService";
import { ArgumentError, errorResponse } from "@/util/errors";
import { parseBulkDeleteIds } from "@/util/itemPrice";
import { authorizeItemPriceUser } from "../authorize";

export async function POST(request: NextRequest) {
  try {
    await authorizeItemPriceUser((await auth())?.user);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ArgumentError("Request body must be valid JSON.");
    }
    let ids: number[];
    try {
      ids = parseBulkDeleteIds(body);
    } catch (error) {
      throw new ArgumentError(
        error instanceof Error ? error.message : "Invalid ids payload."
      );
    }
    const count = await ItemPriceService.removeMany(ids);
    return NextResponse.json({ count });
  } catch (error) {
    return errorResponse(error);
  }
}

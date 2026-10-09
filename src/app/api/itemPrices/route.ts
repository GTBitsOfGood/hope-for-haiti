import { NextRequest, NextResponse } from "next/server";
import type { User } from "next-auth";
import { auth } from "@/auth";
import UserService from "@/services/userService";
import { ItemPriceService } from "@/services/itemPriceService";
import { ArgumentError, AuthenticationError, errorResponse } from "@/util/errors";
import { parseItemPriceListQuery } from "@/util/itemPrice";

function authorize(user: User | null | undefined) {
  if (!user) throw new AuthenticationError("Session required");
  UserService.checkStaff(user);
  UserService.checkPermission(user, "offerWrite");
  const id = Number(user.id);
  if (!Number.isSafeInteger(id) || id <= 0 || id > 2_147_483_647) throw new AuthenticationError("Invalid user session");
  return id;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    authorize(session?.user);
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
    const userId = authorize(session?.user);
    let body: unknown;
    try { body = await request.json(); } catch { throw new ArgumentError("Request body must be valid JSON."); }
    return NextResponse.json(await ItemPriceService.create(body, userId), { status: 201 });
  } catch (error) { return errorResponse(error); }
}


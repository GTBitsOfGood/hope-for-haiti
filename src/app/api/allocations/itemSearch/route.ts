import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  authenticationError,
  argumentError,
  authorizationError,
} from "@/util/responses";
import { UserType, Prisma } from "@prisma/client";

/**
 * GET: Search for items matching the title, type, expiration and unitSize
 *
 * @param {NextRequest} request The incoming HTTP request (query params in URL)
 * @returns 401 if session is invalid
 * @returns 403 if user is not staff/admin/superadmin
 * @returns 400 if required query params are missing or invalid
 * @returns 200 with a JSON object containing donorNames, lotNumbers, palletNumbers, boxNumbers
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return authenticationError("Session required");
  }
  if (
    session.user.type !== UserType.STAFF &&
    session.user.type !== UserType.ADMIN &&
    session.user.type !== UserType.SUPER_ADMIN
  ) {
    return authorizationError("Unauthorized");
  }

  const url = new URL(request.url);
  const title = url.searchParams.get("title");
  const type = url.searchParams.get("type");
  const expiration = url.searchParams.get("expiration");
  const unitSizeStr = url.searchParams.get("unitSize");
  const donorName = url.searchParams.get("donorName");
  const lotNumberStr = url.searchParams.get("lotNumber");
  const palletNumberStr = url.searchParams.get("palletNumber");
  const boxNumberStr = url.searchParams.get("boxNumber");


// make sure they exist
  if (!title || !type || !expiration || !unitSizeStr) {
    return argumentError(
      "Missing required query params: title, type, expiration, unitSize"
    );
  }

  const unitSize = parseInt(unitSizeStr, 10);
  if (isNaN(unitSize)) {
    return argumentError("unitSize must be an integer");
  }

  const whereClause: Prisma.ItemWhereInput = {
    title,
    type,
    expirationDate: new Date(expiration),
    unitSize,
  };

  if (donorName) {
    whereClause.donorName = donorName;
  }
  if (lotNumberStr) {
    const parsedLotNumber = parseInt(lotNumberStr, 10);
    if (!isNaN(parsedLotNumber)) {
      whereClause.lotNumber = parsedLotNumber;
    }
  }
  if (palletNumberStr) {
    const parsedPalletNumber = parseInt(palletNumberStr, 10);
    if (!isNaN(parsedPalletNumber)) {
      whereClause.palletNumber = parsedPalletNumber;
    }
  }
  if (boxNumberStr) {
    const parsedBoxNumber = parseInt(boxNumberStr, 10);
    if (!isNaN(parsedBoxNumber)) {
      whereClause.boxNumber = parsedBoxNumber;
    }
  }

  // query the DB for matching items
  const items = await db.item.findMany({
    where: whereClause,
  });

  // build sets of unique donor/lot/pallet/box values
  const donorNames = new Set<string>();
  const lotNumbers = new Set<number>();
  const palletNumbers = new Set<number>();
  const boxNumbers = new Set<number>();

  for (const item of items) {
    donorNames.add(item.donorName);
    lotNumbers.add(item.lotNumber);
    palletNumbers.add(item.palletNumber);
    boxNumbers.add(item.boxNumber);
  }

  return NextResponse.json({
    donorNames: Array.from(donorNames),
    lotNumbers: Array.from(lotNumbers),
    palletNumbers: Array.from(palletNumbers),
    boxNumbers: Array.from(boxNumbers),
  });
}

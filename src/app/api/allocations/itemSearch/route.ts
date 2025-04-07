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
  const expirationDate = url.searchParams.get("expirationDate");
  const unitType = url.searchParams.get("unitType");
  const quantityPerUnitStr = url.searchParams.get("quantityPerUnit");
  const donorName = url.searchParams.get("donorName");
  const lotNumberStr = url.searchParams.get("lotNumber");
  const palletNumberStr = url.searchParams.get("palletNumber");
  const boxNumberStr = url.searchParams.get("boxNumber");

  // make sure they exist
  if (!title || !type || !expirationDate || !unitType || !quantityPerUnitStr) {
    return argumentError(
      "Missing required query params: title, type, expirationDate, unitType, quantityPerUnit"
    );
  }

  const quantityPerUnit = parseInt(quantityPerUnitStr);
  if (isNaN(quantityPerUnit)) {
    return argumentError("quantityPerUnit must be an integer");
  }

  const whereClause: Prisma.ItemWhereInput = {
    title,
    type,
    expirationDate: new Date(expirationDate),
    unitType,
    quantityPerUnit,
  };

  if (donorName) whereClause.donorName = donorName;
  if (lotNumberStr) whereClause.lotNumber = lotNumberStr;
  if (palletNumberStr) whereClause.palletNumber = palletNumberStr;
  if (boxNumberStr) whereClause.boxNumber = boxNumberStr;

  // query the DB for matching items
  const items = await db.item.findMany({
    where: whereClause,
  });
  console.log(items);
  console.log(whereClause);

  // build sets of unique donor/lot/pallet/box values
  const donorNames = new Set<string>();
  const lotNumbers = new Set<string>();
  const palletNumbers = new Set<string>();
  const boxNumbers = new Set<string>();

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

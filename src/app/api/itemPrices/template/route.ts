import { NextResponse } from "next/server";
import Papa from "papaparse";
import { auth } from "@/auth";
import { errorResponse } from "@/util/errors";
import { authorizeItemPriceUser } from "../authorize";

export async function GET() {
  try {
    const session = await auth();
    authorizeItemPriceUser(session?.user);

    const csv = `\uFEFF${Papa.unparse({
      fields: ["Code", "Name", "Price"],
      data: [],
    })}`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="pricebook-template.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

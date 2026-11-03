import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import FileService from "@/services/fileService";
import { ItemPriceService } from "@/services/itemPriceService";
import { ArgumentError, errorResponse } from "@/util/errors";
import { authorizeItemPriceUser } from "../authorize";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = authorizeItemPriceUser(session?.user);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ArgumentError("File is required");
    }

    const parsed = await FileService.parsePricebookFile(file);
    if (request.nextUrl.searchParams.get("preview") === "true") {
      return NextResponse.json(await ItemPriceService.reviewUpload(parsed.rows));
    }

    const rawSelection = formData.get("selectedLineNumbers");
    if (typeof rawSelection !== "string") {
      throw new ArgumentError("Selected line numbers are required");
    }

    let selected: unknown;
    try {
      selected = JSON.parse(rawSelection);
    } catch {
      throw new ArgumentError("Selected line numbers must be valid JSON");
    }
    if (
      !Array.isArray(selected) ||
      !selected.every(
        (line) => Number.isSafeInteger(line) && Number(line) > 0
      )
    ) {
      throw new ArgumentError("Selected line numbers must be positive integers");
    }

    return NextResponse.json(
      await ItemPriceService.saveUpload(parsed.rows, selected as number[], userId)
    );
  } catch (error) {
    return errorResponse(error);
  }
}

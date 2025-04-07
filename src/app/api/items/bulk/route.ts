import { auth } from "@/auth";
import { db } from "@/db";
import {
  argumentError,
  authenticationError,
  authorizationError,
} from "@/util/responses";
import { ItemCategory, UserType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as XLSX from "xlsx";
import Papa from "papaparse";

const AUTHORIZED_USER_TYPES = [
  UserType.ADMIN,
  UserType.SUPER_ADMIN,
] as UserType[];

const requiredKeys = [
  "title",
  "type",
  "expirationDate",
  "unitType",
  "quantityPerUnit",
  "category",
  "donorName",
  "quantity",
  "datePosted",
  "lotNumber",
  "palletNumber",
  "boxNumber",
  "unitPrice",
  "maxRequestLimit",
  "ndc",
  "notes",
  "visible",
  "allowAllocations",
  "gik",
];

const containsRequiredKeys = (fields?: string[]) =>
  fields ? requiredKeys.every((key) => fields.includes(key)) : false;

const SingleItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string(),
  expirationDate: z
    .union([
      z.coerce.date(),
      z.string().transform((val) => (val.trim() === "" ? undefined : val)),
    ])
    .optional(),
  unitType: z.string(),
  quantityPerUnit: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : Number(val)))
    .pipe(z.number().int().min(0, "Quantity must be non-negative")),
  donorName: z.string(),
  category: z.nativeEnum(ItemCategory),
  quantity: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : Number(val)))
    .pipe(z.number().int().min(0, "Quantity must be non-negative")),
  datePosted: z.coerce.date(),
  lotNumber: z.string(),
  palletNumber: z.string(),
  boxNumber: z.string(),
  unitPrice: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : Number(val)))
    .pipe(z.number().min(0)),
  maxRequestLimit: z.string(),
  ndc: z.string().optional(),
  visible: z
    .string()
    .transform((val) => val.toLowerCase())
    .refine((val) => val === "true" || val === "false", {
      message: "Invalid boolean value",
    })
    .transform((val) => val === "true"),
  allowAllocations: z
    .string()
    .transform((val) => val.toLowerCase())
    .refine((val) => val === "true" || val === "false", {
      message: "Invalid boolean value",
    })
    .transform((val) => val === "true"),
  gik: z
    .string()
    .transform((val) => val.toLowerCase())
    .refine((val) => val === "true" || val === "false", {
      message: "Invalid boolean value",
    })
    .transform((val) => val === "true"),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session?.user)
    return authenticationError("Session required");
  if (!AUTHORIZED_USER_TYPES.includes(session.user.type))
    return authorizationError("Not authorized");

  const url = new URL(request.url);
  const preview = url.searchParams.get("preview") === "true"; // Query param handling
  const formData = await request.formData();
  const file = formData.get("file") as File | null; // Get file from formData

  if (!file) {
    return argumentError("No file provided");
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase();
  if (!["csv", "xlsx"].includes(fileExt || "")) {
    return argumentError(
      `Error opening ${file.name}: must be a valid CSV or XLSX file`
    );
  }

  let jsonData: unknown[] = [];

  try {
    if (fileExt === "xlsx") {
      const buffer = await file.arrayBuffer(); // Convert file to ArrayBuffer
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const csvText = XLSX.utils.sheet_to_csv(sheet);
      const { data, meta } = Papa.parse(csvText, { header: true });

      if (!meta.fields || !containsRequiredKeys(meta.fields)) {
        return argumentError("CSV does not contain required keys");
      }

      jsonData = data;
    } else if (fileExt === "csv") {
      const text = await file.text(); // Read file as text
      const { data, meta } = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });

      if (!meta.fields || !containsRequiredKeys(meta.fields)) {
        console.log(requiredKeys.filter((k) => !meta.fields?.includes(k)));
        return argumentError("CSV does not contain required keys");
      }

      jsonData = data;
    }

    const errors: string[] = [];
    const validItems: (typeof SingleItemSchema._type)[] = [];

    jsonData.forEach((row, index) => {
      const parsed = SingleItemSchema.safeParse(row);
      if (!parsed.success) {
        const errorMessages = parsed.error.issues
          .map((issue) => {
            const field = issue.path.join("."); // Get the column name that caused the error
            return `Column '${field}': ${issue.message}`;
          })
          .join("; ");
        errors.push(
          `Error validating item on row ${index + 1}: ${errorMessages}`
        );
      } else {
        validItems.push(parsed.data);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    if (preview) {
      return NextResponse.json({ items: validItems.slice(0, 8) });
    }

    await db.item.createMany({ data: validItems });

    return NextResponse.json({
      success: true,
      createdCount: validItems.length,
    });
  } catch (error) {
    console.error(error);
    return argumentError("Error processing file");
  }
}

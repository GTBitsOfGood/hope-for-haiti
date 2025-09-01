import { db } from "@/db";
import { ItemCategory } from "@prisma/client";
import { z } from "zod";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  CreateItemData,
  BulkItemData,
  BulkUploadResult,
  UnallocatedItemRequestSummary
} from "@/types/api/item.types";

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
  "donorShippingNumber",
  "hfhShippingNumber",
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
  donorShippingNumber: z.string().optional(),
  hfhShippingNumber: z.string().optional(),
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

export class ItemService {
  static async createItem(data: CreateItemData) {
    const createdItem = await db.item.create({
      data: {
        ...data,
      },
    });

    return createdItem;
  }

  static async getAllItems() {
    const items = await db.item.findMany();
    return items;
  }

  static async getUnallocatedItemRequestsForItem(itemId: number): Promise<UnallocatedItemRequestSummary[]> {
    const allocations = await db.unallocatedItemRequestAllocation.findMany({
      where: { itemId },
      include: {
        unallocatedItemRequest: {
          select: {
            id: true,
            partnerId: true,
            quantity: true,
            comments: true,
          },
        },
      },
    });

    return allocations
      .map(allocation => allocation.unallocatedItemRequest)
      .filter((request): request is NonNullable<typeof request> => request !== null);
  }

  static async processBulkUpload(file: File, preview: boolean = false): Promise<BulkUploadResult> {
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx"].includes(fileExt || "")) {
      throw new Error(`Error opening ${file.name}: must be a valid CSV or XLSX file`);
    }

    let jsonData: unknown[] = [];

    if (fileExt === "xlsx") {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const csvText = XLSX.utils.sheet_to_csv(sheet);
      const { data, meta } = Papa.parse(csvText, { header: true });

      if (!meta.fields || !containsRequiredKeys(meta.fields)) {
        throw new Error("CSV does not contain required keys");
      }

      jsonData = data;
    } else if (fileExt === "csv") {
      const text = await file.text();
      const { data, meta } = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });

      if (!meta.fields || !containsRequiredKeys(meta.fields)) {
        throw new Error("CSV does not contain required keys");
      }

      jsonData = data;
    }

    const errors: string[] = [];
    const validItems: BulkItemData[] = [];

    jsonData.forEach((row, index) => {
      const parsed = SingleItemSchema.safeParse(row);
      if (!parsed.success) {
        const errorMessages = parsed.error.issues
          .map((issue) => {
            const field = issue.path.join(".");
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
      return {
        success: false,
        errors,
      };
    }

    if (preview) {
      return {
        success: true,
        items: validItems.slice(0, 8),
      };
    }

    await db.item.createMany({ data: validItems });

    return {
      success: true,
      createdCount: validItems.length,
    };
  }
}

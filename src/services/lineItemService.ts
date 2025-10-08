import { db } from "@/db";
import { ItemCategory, LineItem, Prisma } from "@prisma/client";
import { z } from "zod";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  CreateItemData,
  BulkItemData,
  BulkUploadResult,
} from "@/types/api/item.types";
import { Filters } from "@/types/api/filter.types";
import { buildQueryWithPagination, buildWhereFromFilters } from "@/util/table";

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

export const singleLineItemSchema = z.object({
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

export class LineItemService {
  static async createItem(data: CreateItemData, generalItemId?: number) {
    const createdItem = await db.lineItem.create({
      data: {
        ...data,
        ...(generalItemId !== undefined
          ? { generalItem: { connect: { id: generalItemId } } }
          : {}),
      },
    });

    return createdItem;
  }

  static async updateLineItem(
    lineItemId: number,
    data: Partial<CreateItemData>
  ) {
    try {
      const updatedItem = await db.lineItem.update({
        where: { id: lineItemId },
        data,
      });

      return updatedItem;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new Error(`Line item with ID ${lineItemId} does not exist.`);
        }
      }
      throw error;
    }
  }

  static async deleteLineItem(lineItemId: number) {
    try {
      await db.lineItem.delete({
        where: { id: lineItemId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new Error(`Line item with ID ${lineItemId} does not exist.`);
        }
      }
      throw error;
    }
  }

  static async getAllItems(
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<{ items: LineItem[]; total: number }> {
    const where = buildWhereFromFilters<Prisma.LineItemWhereInput>(
      Object.keys(Prisma.LineItemScalarFieldEnum),
      filters
    );

    const query: Prisma.LineItemFindManyArgs = {
      where,
    };

    buildQueryWithPagination(query, page, pageSize);

    const [items, total] = await Promise.all([
      db.lineItem.findMany(query),
      db.lineItem.count({ where }),
    ]);

    return { items, total };
  }

  static async getLineItemsForGeneralItem(
    generalItemId: number,
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<{ items: LineItem[]; total: number }> {
    const filterWhere = buildWhereFromFilters<Prisma.LineItemWhereInput>(
      Object.keys(Prisma.LineItemScalarFieldEnum),
      filters
    );

    const where: Prisma.LineItemWhereInput = {
      ...filterWhere,
      generalItemId,
    };

    const query: Prisma.LineItemFindManyArgs = {
      where,
    };

    buildQueryWithPagination(query, page, pageSize);

    const [items, total] = await Promise.all([
      db.lineItem.findMany(query),
      db.lineItem.count({ where }),
    ]);

    return { items, total };
  }

  static async processBulkUpload(
    file: File,
    preview: boolean = false
  ): Promise<BulkUploadResult> {
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx"].includes(fileExt || "")) {
      throw new Error(
        `Error opening ${file.name}: must be a valid CSV or XLSX file`
      );
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
      const parsed = singleLineItemSchema.safeParse(row);
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

    await db.lineItem.createMany({ data: validItems });

    return {
      success: true,
      createdCount: validItems.length,
    };
  }
}

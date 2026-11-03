import { Prisma } from "@prisma/client";
import { db } from "@/db";
import { itemPriceInputSchema } from "@/schema/itemPrice";
import { MAX_INT32_ID, needsItemPriceRecheck } from "@/util/itemPrice";
import {
  ArgumentError,
  ConflictError,
  InternalError,
  NotFoundError,
} from "@/util/errors";
import {
  buildItemPriceUploadReview,
  getItemPriceUploadCodes,
} from "@/util/itemPriceUpload";
import type {
  ItemPriceInput,
  ItemPriceResponse,
  ItemPriceUploadReview,
  ParsedPricebookRow,
} from "@/types/api/itemPrice.types";

const rowSelect = {
  id: true,
  ndc: true,
  name: true,
  unitPrice: true,
  createdAt: true,
  updatedAt: true,
  enteredBy: { select: { id: true, name: true } },
} as const;

function assertPriceId(id: number): void {
  if (!Number.isSafeInteger(id) || id <= 0 || id > MAX_INT32_ID) {
    throw new ArgumentError("Item price ID must be a positive 32-bit integer.");
  }
}

function validate(input: unknown): ItemPriceInput {
  const parsed = itemPriceInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new ArgumentError(parsed.error.issues.map((issue) => `${issue.path.join(".") || "Input"}: ${issue.message}`).join("; "));
  }
  return parsed.data;
}

function serialize(row: {
  id: number;
  ndc: string;
  name: string | null;
  unitPrice: Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
  enteredBy: { id: number; name: string | null };
}, referenceDate = new Date()): ItemPriceResponse {
  return {
    id: row.id,
    ndc: row.ndc,
    name: row.name,
    unitPrice: row.unitPrice.toFixed(2),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    enteredBy: { id: row.enteredBy.id, name: row.enteredBy.name ?? "" },
    needsRecheck: needsItemPriceRecheck(row.updatedAt, referenceDate),
  };
}

function dbError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") throw new ConflictError("A price already exists for this NDC.");
    if (error.code === "P2025") throw new NotFoundError("Item price not found");
  }
  throw error;
}

export class ItemPriceService {
  static async list(options: { page: number; pageSize: number; ndcFilter?: string }) {
    const where = options.ndcFilter ? { ndc: { contains: options.ndcFilter, mode: "insensitive" as const } } : {};
    const [rows, total] = await Promise.all([
      db.itemPrice.findMany({
        where,
        orderBy: [{ ndc: "asc" }, { id: "asc" }],
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
        select: rowSelect,
      }),
      db.itemPrice.count({ where }),
    ]);
    const snapshot = new Date();
    return { data: rows.map((row) => serialize(row, snapshot)), total };
  }

  static async create(input: unknown, enteredById: number): Promise<ItemPriceResponse> {
    const data = validate(input);
    if (!Number.isSafeInteger(enteredById) || enteredById <= 0 || enteredById > MAX_INT32_ID) {
      throw new ArgumentError("A valid staff user is required.");
    }
    try {
      const row = await db.itemPrice.create({ data: { ...data, name: data.name ?? null, unitPrice: new Prisma.Decimal(data.unitPrice), enteredById }, select: rowSelect });
      return serialize(row);
    } catch (error) {
      return dbError(error);
    }
  }

  static async update(id: number, input: unknown, enteredById: number): Promise<ItemPriceResponse> {
    assertPriceId(id);
    const data = validate(input);
    if (!Number.isSafeInteger(enteredById) || enteredById <= 0 || enteredById > MAX_INT32_ID) {
      throw new ArgumentError("A valid staff user is required.");
    }
    try {
      const row = await db.itemPrice.update({ where: { id }, data: { ...data, name: data.name, unitPrice: new Prisma.Decimal(data.unitPrice), enteredById, updatedAt: new Date() }, select: rowSelect });
      return serialize(row);
    } catch (error) {
      return dbError(error);
    }
  }

  static async reviewUpload(
    rows: ParsedPricebookRow[]
  ): Promise<ItemPriceUploadReview> {
    const codes = getItemPriceUploadCodes(rows);
    const existing = codes.length
      ? await db.itemPrice.findMany({
          where: { ndc: { in: codes } },
          select: {
            id: true,
            ndc: true,
            name: true,
            unitPrice: true,
            updatedAt: true,
          },
        })
      : [];

    return buildItemPriceUploadReview(
      rows,
      existing.map((row) => ({
        id: row.id,
        ndc: row.ndc,
        name: row.name,
        unitPrice: row.unitPrice.toFixed(2),
        updatedAt: row.updatedAt.toISOString(),
      }))
    );
  }

  static async saveUpload(
    rows: ParsedPricebookRow[],
    selectedLineNumbers: number[],
    enteredById: number
  ): Promise<{ saved: number }> {
    if (!Number.isSafeInteger(enteredById) || enteredById <= 0 || enteredById > MAX_INT32_ID) {
      throw new ArgumentError("A valid staff user is required.");
    }

    const review = await this.reviewUpload(rows);
    const selected = new Set(selectedLineNumbers);
    if (selected.size === 0) {
      throw new ArgumentError("Select at least one price to save.");
    }

    const actionable = [
      ...review.groups.new,
      ...review.groups.changed,
      ...review.groups.same,
    ];
    const chosen = actionable.filter((line) => selected.has(line.lineNumber));
    if (chosen.length !== selected.size) {
      throw new ArgumentError(
        "Some selected lines are not available to save. Review the file again."
      );
    }

    const savedAt = new Date();
    const operations = chosen.map((line) => {
      if (!line.code || !line.price) {
        throw new ArgumentError("Selected lines must have a valid code and price.");
      }
      if (line.status === "new") {
        return db.itemPrice.create({
          data: {
            ndc: line.code,
            name: line.name,
            unitPrice: new Prisma.Decimal(line.price),
            enteredById,
            createdAt: savedAt,
            updatedAt: savedAt,
          },
        });
      }
      return db.itemPrice.update({
        where: {
          id: line.old!.id,
          updatedAt: new Date(line.old!.updatedAt),
        },
        data: {
          name: line.name,
          unitPrice: new Prisma.Decimal(line.price),
          enteredById,
          updatedAt: savedAt,
        },
      });
    });

    try {
      await db.$transaction(operations);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (["P2002", "P2025"].includes(error.code)) {
          throw new ConflictError(
            "Prices changed while you were reviewing. Review the file again."
          );
        }
        if (["P2028", "P2034"].includes(error.code)) {
          throw new InternalError(
            "Unable to save prices. Please try again."
          );
        }
      }
      return dbError(error);
    }

    return { saved: chosen.length };
  }

  static async remove(id: number): Promise<void> {
    assertPriceId(id);
    try {
      await db.itemPrice.delete({ where: { id } });
    } catch (error) {
      return dbError(error);
    }
  }
}

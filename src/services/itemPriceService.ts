import { Prisma } from "@prisma/client";
import { db } from "@/db";
import { itemPriceInputSchema } from "@/schema/itemPrice";
import { canonicalizeNdc, MAX_INT32_ID, needsItemPriceRecheck } from "@/util/itemPrice";
import { ArgumentError, ConflictError, NotFoundError } from "@/util/errors";
import type { ItemPriceInput, ItemPriceResponse } from "@/types/api/itemPrice.types";

const rowSelect = {
  id: true,
  ndc: true,
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
  return { ndc: canonicalizeNdc(parsed.data.ndc), unitPrice: parsed.data.unitPrice };
}

function serialize(row: {
  id: number;
  ndc: string;
  unitPrice: Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
  enteredBy: { id: number; name: string | null };
}, referenceDate = new Date()): ItemPriceResponse {
  return {
    id: row.id,
    ndc: row.ndc,
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
      const row = await db.itemPrice.create({ data: { ...data, unitPrice: new Prisma.Decimal(data.unitPrice), enteredById }, select: rowSelect });
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
      const row = await db.itemPrice.update({ where: { id }, data: { ...data, unitPrice: new Prisma.Decimal(data.unitPrice), enteredById, updatedAt: new Date() }, select: rowSelect });
      return serialize(row);
    } catch (error) {
      return dbError(error);
    }
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

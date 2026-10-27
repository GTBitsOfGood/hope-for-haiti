import { itemPriceInputSchema } from "@/schema/itemPrice";
import { formatItemPriceMoney, isPositiveMoneyString } from "@/util/itemPrice";
import type {
  ItemPriceUploadLine,
  ItemPriceUploadReview,
  ParsedPricebookRow,
} from "@/types/api/itemPrice.types";

type ExistingItemPrice = {
  id: number;
  ndc: string;
  name: string | null;
  unitPrice: string;
  updatedAt: string;
};

type ParsedUploadLine = {
  line: ItemPriceUploadLine;
  canonicalCode: string | null;
};

type Cell = {
  text: string;
  valid: boolean;
};

function readCell(value: unknown): Cell {
  if (value == null) return { text: "", valid: true };
  if (typeof value === "string") return { text: value.trim(), valid: true };
  if (typeof value === "number" && Number.isFinite(value)) {
    return { text: String(value), valid: true };
  }
  return { text: "", valid: false };
}

function baseLine(
  row: ParsedPricebookRow,
  rawCode: string,
  rawPrice: string
): ItemPriceUploadLine {
  return {
    lineNumber: row.lineNumber,
    status: "problem",
    code: null,
    rawCode,
    name: null,
    price: null,
    rawPrice,
    old: null,
    reasons: [],
  };
}

function parseRows(rows: ParsedPricebookRow[]): {
  parsed: ParsedUploadLine[];
  skipped: number;
} {
  const parsed: ParsedUploadLine[] = [];
  let skipped = 0;

  for (const row of rows) {
    const codeCell = readCell(row.code);
    const nameCell = readCell(row.name);
    const priceCell = readCell(row.price);

    // A blank price is intentionally skipped. This is the format produced by
    // the price-check download list before the user fills prices in.
    if (priceCell.valid && priceCell.text === "") {
      skipped++;
      continue;
    }

    const line = baseLine(row, codeCell.text, priceCell.text);
    const reasons = line.reasons;

    if (!codeCell.valid) reasons.push("Code must be text or a number.");
    if (!priceCell.valid) reasons.push("Price must be a single number.");
    if (!nameCell.valid) reasons.push("Name must be text or a number.");

    let canonicalCode: string | null = null;
    if (codeCell.valid && codeCell.text) {
      const codeResult = itemPriceInputSchema.safeParse({
        ndc: codeCell.text,
        unitPrice: "1",
      });
      if (codeResult.success) {
        canonicalCode = codeResult.data.ndc;
        line.code = canonicalCode;
      } else {
        const issue = codeResult.error.issues.find((entry) =>
          entry.path.includes("ndc")
        );
        reasons.push(issue?.message ?? "Enter a recognizable code.");
      }
    } else if (codeCell.valid) {
      reasons.push("Code is required.");
    }

    if (priceCell.valid && priceCell.text) {
      if (!isPositiveMoneyString(priceCell.text)) {
        reasons.push(
          "Price must be greater than zero, with up to two decimal places and within the supported range."
        );
      } else {
        line.price = formatItemPriceMoney(priceCell.text);
      }
    }

    line.name = nameCell.valid ? nameCell.text || null : null;
    if (reasons.length === 0) line.status = "new";
    parsed.push({ line, canonicalCode });
  }

  return { parsed, skipped };
}

export function getItemPriceUploadCodes(rows: ParsedPricebookRow[]): string[] {
  const { parsed } = parseRows(rows);
  return Array.from(
    new Set(
      parsed
        .map(({ canonicalCode }) => canonicalCode)
        .filter((code): code is string => code !== null)
    )
  );
}

export function buildItemPriceUploadReview(
  rows: ParsedPricebookRow[],
  existingPrices: ExistingItemPrice[]
): ItemPriceUploadReview {
  const { parsed, skipped } = parseRows(rows);

  const duplicateGroups = new Map<string, ParsedUploadLine[]>();
  for (const entry of parsed) {
    if (!entry.canonicalCode) continue;
    const group = duplicateGroups.get(entry.canonicalCode) ?? [];
    group.push(entry);
    duplicateGroups.set(entry.canonicalCode, group);
  }
  for (const [code, group] of duplicateGroups) {
    if (group.length < 2) continue;
    const lines = group.map((entry) => entry.line.lineNumber).join(", ");
    for (const entry of group) {
      entry.line.status = "problem";
      entry.line.reasons.push(
        `Code ${code} appears more than once in this file (lines ${lines}).`
      );
    }
  }

  const existingByCode = new Map(
    existingPrices.map((price) => [price.ndc, price])
  );
  const groups: ItemPriceUploadReview["groups"] = {
    new: [],
    changed: [],
    same: [],
    problems: [],
  };

  for (const { line, canonicalCode } of parsed) {
    if (line.status === "problem" || !canonicalCode) {
      line.status = "problem";
      if (line.reasons.length === 0) {
        line.reasons.push("This line cannot be imported.");
      }
      groups.problems.push(line);
      continue;
    }

    const existing = existingByCode.get(canonicalCode);
    if (!existing) {
      line.status = "new";
      groups.new.push(line);
      continue;
    }

    line.name = line.name ?? existing.name;
    line.old = {
      id: existing.id,
      name: existing.name,
      unitPrice: existing.unitPrice,
      updatedAt: existing.updatedAt,
    };

    if (
      existing.unitPrice === line.price &&
      (existing.name ?? null) === (line.name ?? null)
    ) {
      line.status = "same";
      groups.same.push(line);
    } else {
      line.status = "changed";
      groups.changed.push(line);
    }
  }

  return {
    groups,
    counts: {
      new: groups.new.length,
      changed: groups.changed.length,
      same: groups.same.length,
      problems: groups.problems.length,
      skipped,
    },
    totalRows: rows.length,
  };
}

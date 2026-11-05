import { parseItemCode, type ParseItemCodeResult } from "@/util/ndc";
import { needsItemPriceRecheck } from "@/util/itemPrice";
import type {
  PriceCheck,
  PriceCheckedItem,
  PriceCheckCodeOverride,
  PriceCheckStatus,
} from "@/types/api/donorOffer.types";

export type PriceBookEntry = {
  id: number;
  ndc: string;
  unitPrice: string;
  updatedAt: Date | string;
};

const BLOCKING_STATUSES = new Set<PriceCheckStatus>(["missing", "expired"]);

/** Single place that decides whether a status blocks Finalize. */
export function doesPriceCheckBlockFinalize(status: PriceCheckStatus): boolean {
  return BLOCKING_STATUSES.has(status);
}

export const CODE_OVERRIDE_REQUIRED_MESSAGE = "Enter a code.";
export const CODE_OVERRIDE_UNREADABLE_MESSAGE =
  "Enter a recognizable NDC or 12-digit UPC. A 10-digit code without dashes is ambiguous.";
export const CODE_OVERRIDE_READABLE_MESSAGE =
  "This row already has a readable code and cannot be changed.";

export type CodeOverrideValidation =
  | { status: "valid"; value: string; type: "NDC" | "UPC" }
  | { status: "error"; message: string };

/**
 * Validate a code typed for one price-check row. The original value is kept
 * separate so a caller cannot use this path to replace a code that already
 * parsed successfully.
 */
export function validateCodeOverride(
  originalCode: unknown,
  typedCode: string
): CodeOverrideValidation {
  const typed = String(typedCode ?? "").trim();
  if (!typed) {
    return { status: "error", message: CODE_OVERRIDE_REQUIRED_MESSAGE };
  }

  const original = originalCode == null ? "" : String(originalCode);
  if (parseItemCode(original).status === "normalized") {
    return { status: "error", message: CODE_OVERRIDE_READABLE_MESSAGE };
  }

  const parsed = parseItemCode(typed);
  if (parsed.status === "normalized") {
    return { status: "valid", value: parsed.value, type: parsed.type };
  }
  if (parsed.status === "empty") {
    return { status: "error", message: CODE_OVERRIDE_REQUIRED_MESSAGE };
  }
  return { status: "error", message: CODE_OVERRIDE_UNREADABLE_MESSAGE };
}

export type ApplyCodeOverridesResult =
  | { ok: true; rows: Record<string, unknown>[] }
  | { ok: false; errors: string[] };

/**
 * Apply typed codes to parsed sheet rows by physical sheet row. All overrides
 * are validated before any row is changed, so an invalid value cannot leave a
 * partially-applied request behind.
 */
export function applyCodeOverrides(
  rows: Record<string, unknown>[],
  overrides: PriceCheckCodeOverride[]
): ApplyCodeOverridesResult {
  if (overrides.length === 0) {
    return { ok: true, rows };
  }

  const rowsBySheetRow = new Map<number, Record<string, unknown>>();
  for (const row of rows) {
    if (typeof row.__excelRow === "number") {
      rowsBySheetRow.set(row.__excelRow, row);
    }
  }

  const overridesByRow = new Map<number, string>();
  const errors: string[] = [];

  for (const override of overrides) {
    if (overridesByRow.has(override.row)) {
      errors.push(`Row ${override.row}: code was provided more than once.`);
      continue;
    }
    overridesByRow.set(override.row, override.code);
  }

  const replacements = new Map<number, string>();
  for (const [row, typedCode] of overridesByRow) {
    const sheetRow = rowsBySheetRow.get(row);
    if (!sheetRow) {
      errors.push(`Row ${row}: uploaded row was not found.`);
      continue;
    }

    const validation = validateCodeOverride(sheetRow.ndc, typedCode);
    if (validation.status === "error") {
      errors.push(`Row ${row}: ${validation.message}`);
      continue;
    }
    replacements.set(row, validation.value);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    rows: rows.map((row) => {
      if (typeof row.__excelRow !== "number") return row;
      const replacement = replacements.get(row.__excelRow);
      return replacement === undefined ? row : { ...row, ndc: replacement };
    }),
  };
}

export function moneyStringToCents(value: string): bigint {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
}

export function centsToMoneyString(cents: bigint): string {
  const zero = BigInt(0);
  const hundred = BigInt(100);
  const sign = cents < zero ? "-" : "";
  const abs = cents < zero ? -cents : cents;
  const whole = abs / hundred;
  const fraction = abs % hundred;
  return `${sign}${whole}.${fraction.toString().padStart(2, "0")}`;
}

function formatPriceSetOn(updatedAt: Date | string): string {
  const date = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
  return date.toISOString().split("T")[0];
}

function emptyPriceFields() {
  return {
    itemPriceId: null,
    price: null,
    priceSetOn: null,
    value: null,
  };
}

export function buildPriceCheck(
  parsed: ParseItemCodeResult,
  raw: string | null | undefined,
  quantity: number,
  entry: PriceBookEntry | undefined,
  referenceDate = new Date()
): PriceCheck {
  if (parsed.status === "empty") {
    return {
      status: "no-code",
      code: null,
      codeType: null,
      ...emptyPriceFields(),
    };
  }

  if (parsed.status === "unreadable") {
    const typed = raw == null ? null : String(raw).trim() || null;
    return {
      status: "unreadable",
      code: typed,
      codeType: null,
      ...emptyPriceFields(),
    };
  }

  const code = parsed.value;
  const codeType = parsed.type;

  if (!entry) {
    return {
      status: "missing",
      code,
      codeType,
      ...emptyPriceFields(),
    };
  }

  const price = entry.unitPrice;
  const priceSetOn = formatPriceSetOn(entry.updatedAt);
  const cents = moneyStringToCents(price);

  if (cents === BigInt(0)) {
    return {
      status: "missing",
      code,
      codeType,
      itemPriceId: entry.id,
      price,
      priceSetOn,
      value: null,
    };
  }

  if (needsItemPriceRecheck(entry.updatedAt, referenceDate)) {
    return {
      status: "expired",
      code,
      codeType,
      itemPriceId: entry.id,
      price,
      priceSetOn,
      value: null,
    };
  }

  return {
    status: "priced",
    code,
    codeType,
    itemPriceId: entry.id,
    price,
    priceSetOn,
    value: centsToMoneyString(cents * BigInt(quantity)),
  };
}

export function priceCheckErrorMessage(row: number, status: PriceCheckStatus): string {
  if (status === "expired") {
    return `Row ${row}: price was last updated more than a year ago`;
  }
  return `Row ${row}: price is missing from the pricebook`;
}

// Fallback used only when the backend hasn't attached `canFinalize` to the
// Preview response yet. Once it does, the real value takes precedence.
export function canFinalize(items: PriceCheckedItem[]): boolean {
  return !items.some((item) => doesPriceCheckBlockFinalize(item.priceCheck.status));
}

export interface PriceCheckSummaryResult {
  valueSoFar: number;
  needsPriceCount: number;
  warningCount: number;
}

export function summarize(items: PriceCheckedItem[]): PriceCheckSummaryResult {
  let valueSoFar = 0;
  let needsPriceCount = 0;
  let warningCount = 0;

  for (const item of items) {
    const { status, value } = item.priceCheck;
    if (value !== null) {
      // Defensive: a single malformed `value` string from the backend
      // shouldn't poison the running total with NaN for every other row.
      const parsed = Number(value);
      if (Number.isFinite(parsed)) valueSoFar += parsed;
    }
    if (doesPriceCheckBlockFinalize(status)) needsPriceCount++;
    else if (status === "no-code" || status === "unreadable") warningCount++;
  }

  return { valueSoFar, needsPriceCount, warningCount };
}

export interface PriceCheckCsvRow {
  code: string;
  name: string;
  price: string;
  oldPrice: string;
}

export function itemsNeedingPrice(items: PriceCheckedItem[]): PriceCheckedItem[] {
  const seenCodes = new Set<string>();
  return items.filter(({ priceCheck: { status, code } }) => {
    if (!code || !doesPriceCheckBlockFinalize(status) || seenCodes.has(code)) return false;
    seenCodes.add(code);
    return true;
  });
}

function formatCodeForSpreadsheet({ code, codeType }: PriceCheck): string {
  if (!code) return "";
  if (codeType !== "UPC" || !/^\d{12}$/.test(code)) return code;
  return `${code[0]} ${code.slice(1, 6)} ${code.slice(6, 11)} ${code[11]}`;
}

// One line per code (expired/missing only), deduped since the same code can
// appear on several rows.
export function codesNeedingPrice(items: PriceCheckedItem[]): PriceCheckCsvRow[] {
  return itemsNeedingPrice(items).map(({ title, priceCheck }) => {
    const inPricebook = priceCheck.itemPriceId !== null;
    return {
      code: formatCodeForSpreadsheet(priceCheck),
      name: inPricebook ? "" : title,
      price: "",
      oldPrice: inPricebook ? (priceCheck.price ?? "") : "",
    };
  });
}

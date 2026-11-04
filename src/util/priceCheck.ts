import { type ParseItemCodeResult } from "@/util/ndc";
import { needsItemPriceRecheck } from "@/util/itemPrice";
import type { PriceCheck, PriceCheckedItem, PriceCheckStatus } from "@/types/api/donorOffer.types";

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

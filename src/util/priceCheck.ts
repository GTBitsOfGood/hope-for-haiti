import type { PriceCheckedItem, PriceCheckStatus } from "@/types/api/donorOffer.types";

// Single source of truth for which statuses block Finalize. Per the issue,
// `no-code` and `unreadable` are warning-only for now but may become
// blocking later — change it here only.
export const PRICE_CHECK_BLOCKING_STATUSES: PriceCheckStatus[] = ["missing", "expired"];

export function isBlockingStatus(status: PriceCheckStatus): boolean {
  return PRICE_CHECK_BLOCKING_STATUSES.includes(status);
}

// Fallback used only when the backend hasn't attached `canFinalize` to the
// Preview response yet. Once it does, the real value takes precedence.
export function canFinalize(items: PriceCheckedItem[]): boolean {
  return !items.some((item) => isBlockingStatus(item.priceCheck.status));
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
    if (isBlockingStatus(status)) needsPriceCount++;
    else if (status === "no-code" || status === "unreadable") warningCount++;
  }

  return { valueSoFar, needsPriceCount, warningCount };
}

export interface PriceCheckCsvRow {
  code: string;
  name: string;
  price: string;
}

// One line per code (expired/missing only), deduped since the same code can
// appear on several rows.
export function codesNeedingPrice(items: PriceCheckedItem[]): PriceCheckCsvRow[] {
  const rows = new Map<string, PriceCheckCsvRow>();

  for (const item of items) {
    const { status, code, price } = item.priceCheck;
    if (!isBlockingStatus(status) || !code) continue;
    if (!rows.has(code)) {
      rows.set(code, {
        code,
        name: item.title,
        price: status === "expired" ? (price ?? "") : "",
      });
    }
  }

  return Array.from(rows.values());
}

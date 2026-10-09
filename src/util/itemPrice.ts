export const ITEM_PRICE_RECHECK_DAYS = 365;

export const MAX_INT32_ID = 2_147_483_647;
export const MAX_ITEM_PRICE_CENTS = BigInt("9223372036854775807");
const MAX_PRICE_LENGTH = 32;
const CANONICAL_NDC_PATTERN = /^\d{5}-\d{4}-\d{2}$/;

export function parsePositivePriceId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 && id <= MAX_INT32_ID ? id : null;
}

export function parsePositivePriceInteger(value: string | null, fallback: number, label: string): number {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) throw new Error(`${label} must be a positive integer.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error(`${label} must be a positive integer.`);
  return parsed;
}

export type ItemPriceListQuery = { page: number; pageSize: number; ndcFilter?: string };

export function parseItemPriceListQuery(params: URLSearchParams): ItemPriceListQuery {
  const page = parsePositivePriceInteger(params.get("page"), 1, "page");
  const pageSize = parsePositivePriceInteger(params.get("pageSize"), 10, "pageSize");
  if (pageSize > 100) throw new Error("pageSize must not exceed 100.");
  const offset = (page - 1) * pageSize;
  if (!Number.isSafeInteger(offset) || offset > MAX_INT32_ID) throw new Error("Pagination offset is too large.");

  let ndcFilter: string | undefined;
  const raw = params.get("filters");
  if (raw !== null) {
    let filters: unknown;
    try { filters = JSON.parse(raw); } catch { throw new Error("Filters must be valid JSON."); }
    if (!filters || typeof filters !== "object" || Array.isArray(filters) || Object.keys(filters).some((key) => key !== "ndc")) {
      throw new Error("Only an NDC filter is supported.");
    }
    const ndc = (filters as Record<string, unknown>).ndc;
    if (ndc !== undefined) {
      if (!ndc || typeof ndc !== "object" || Array.isArray(ndc) || Object.keys(ndc).some((key) => key !== "type" && key !== "value") || (ndc as Record<string, unknown>).type !== "string" || typeof (ndc as Record<string, unknown>).value !== "string") {
        throw new Error("NDC filter must be {type:'string',value:string}.");
      }
      ndcFilter = ((ndc as { value: string }).value).trim() || undefined;
    }
  }
  return { page, pageSize, ndcFilter };
}

/** Validate only the canonical NDC format. Does not normalize; replace with #371 normalizeNdc when available. */
export function isCanonicalNdc(value: unknown): value is string {
  return typeof value === "string" && CANONICAL_NDC_PATTERN.test(value);
}

export function canonicalizeNdc(value: unknown): string {
  if (typeof value !== "string") throw new Error("Enter an NDC in canonical format: 00000-0000-00.");
  const ndc = value.trim();
  if (!isCanonicalNdc(ndc)) throw new Error("Enter an NDC in canonical format: 00000-0000-00.");
  return ndc;
}

export function isValidMoneyString(value: string): boolean {
  if (value.length > MAX_PRICE_LENGTH || value !== value.trim() || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)) return false;
  const [whole, fraction = ""] = value.split(".");
  const cents = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  return cents <= MAX_ITEM_PRICE_CENTS;
}

export function needsItemPriceRecheck(updatedAt: Date | string, referenceDate = new Date()): boolean {
  const updated = updatedAt instanceof Date ? updatedAt.getTime() : Date.parse(updatedAt);
  const reference = referenceDate.getTime();
  return Number.isFinite(updated) && Number.isFinite(reference) && reference - updated > ITEM_PRICE_RECHECK_DAYS * 24 * 60 * 60 * 1000;
}

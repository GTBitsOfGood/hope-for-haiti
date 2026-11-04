/**
 * Normalize NDC (National Drug Code) values to the 11-digit 5-4-2 format.
 *
 * An NDC is 10 digits split into labeler-product-package segments in one of
 * three layouts: 4-4-2, 5-3-2, or 5-4-1. The standard stored form pads the
 * short segment so the result is always 5-4-2 (11 digits), e.g. 00093-4155-73.
 *
 * 10 digits with no dashes are unreadable: they can be split three ways, so
 * we never guess. Blank input is "no code", which is distinct from unreadable.
 */

export type NormalizeNdcResult =
  | { status: "normalized"; value: string }
  | { status: "unreadable" }
  | { status: "empty" };

const VALID_SEGMENT_FORMATS: ReadonlyArray<[number, number, number]> = [
  [4, 4, 2],
  [5, 3, 2],
  [5, 4, 1],
  [5, 4, 2], // already normalized
];

function isBlank(raw: string | null | undefined): boolean {
  return raw == null || raw.trim() === "";
}

function isValidSegmentFormat(
  lengths: [number, number, number]
): boolean {
  return VALID_SEGMENT_FORMATS.some(
    ([l, p, pk]) => l === lengths[0] && p === lengths[1] && pk === lengths[2]
  );
}

function toNormalized(
  labelerCode: string,
  productCode: string,
  packageCode: string
): string {
  return `${labelerCode.padStart(5, "0")}-${productCode.padStart(4, "0")}-${packageCode.padStart(2, "0")}`;
}

function fromSegments(
  labelerCode: string,
  productCode: string,
  packageCode: string
): NormalizeNdcResult {
  if (
    !/^\d+$/.test(labelerCode) ||
    !/^\d+$/.test(productCode) ||
    !/^\d+$/.test(packageCode)
  ) {
    return { status: "unreadable" };
  }

  const lengths: [number, number, number] = [
    labelerCode.length,
    productCode.length,
    packageCode.length,
  ];

  if (!isValidSegmentFormat(lengths)) {
    return { status: "unreadable" };
  }

  return {
    status: "normalized",
    value: toNormalized(labelerCode, productCode, packageCode),
  };
}

/**
 * Convert any safely-recognized NDC into the 11-digit 5-4-2 format
 * (`00093-4155-73`). Never guesses an ambiguous layout.
 *
 * - blank / whitespace → `{ status: "empty" }`
 * - valid 4-4-2, 5-3-2, 5-4-1, 5-4-2, or 11 undashed digits → `{ status: "normalized", value }`
 * - 10 undashed digits or any other unparseable value → `{ status: "unreadable" }`
 */
export function normalizeNdc(
  raw: string | null | undefined
): NormalizeNdcResult {
  if (isBlank(raw)) {
    return { status: "empty" };
  }

  const trimmed = raw!.trim();

  if (/^\d+$/.test(trimmed)) {
    if (trimmed.length === 11) {
      return fromSegments(
        trimmed.slice(0, 5),
        trimmed.slice(5, 9),
        trimmed.slice(9, 11)
      );
    }
    // 10 undashed digits can be 4-4-2, 5-3-2, or 5-4-1 — do not guess.
    return { status: "unreadable" };
  }

  const segments = trimmed.split("-");
  if (segments.length !== 3) {
    return { status: "unreadable" };
  }

  return fromSegments(segments[0], segments[1], segments[2]);
}

/**
 * UPC-A check digit: odd-position digits (1-indexed) * 3, plus even-position
 * digits excluding the last, then the last digit must make the total a
 * multiple of 10.
 */
export function isValidUpcCheckDigit(digits: string): boolean {
  if (!/^\d{12}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const n = digits.charCodeAt(i) - 48;
    sum += i % 2 === 0 ? n * 3 : n;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === digits.charCodeAt(11) - 48;
}

export type NormalizeUpcResult =
  | { status: "normalized"; value: string }
  | { status: "unreadable" }
  | { status: "empty" };

/**
 * A UPC is exactly 12 digits after stripping spaces and dashes, with a valid
 * check digit. Anything else is unreadable. Blank is empty.
 */
export function normalizeUpc(
  raw: string | null | undefined
): NormalizeUpcResult {
  if (isBlank(raw)) {
    return { status: "empty" };
  }

  const digits = raw!.replace(/[\s-]/g, "");
  if (!/^\d{12}$/.test(digits) || !isValidUpcCheckDigit(digits)) {
    return { status: "unreadable" };
  }

  return { status: "normalized", value: digits };
}

export type ParseItemCodeResult =
  | { status: "normalized"; type: "NDC" | "UPC"; value: string }
  | { status: "unreadable" }
  | { status: "empty" };

/**
 * Read a cell that may hold an NDC or a UPC. Try NDC first (unchanged rules),
 * then UPC. Never guess an ambiguous 10-digit NDC or an 11-digit value that
 * might be a UPC with a dropped leading zero.
 */
export function parseItemCode(
  raw: string | null | undefined
): ParseItemCodeResult {
  const ndc = normalizeNdc(raw);
  if (ndc.status === "empty") {
    return { status: "empty" };
  }
  if (ndc.status === "normalized") {
    return { status: "normalized", type: "NDC", value: ndc.value };
  }

  const upc = normalizeUpc(raw);
  if (upc.status === "normalized") {
    return { status: "normalized", type: "UPC", value: upc.value };
  }

  return { status: "unreadable" };
}

/**
 * Decide what to persist on a finalized offer line item.
 * Readable NDC/UPC codes are stored on `ndc`. Unreadable codes stay
 * out of `ndc` and keep the original value in additionalInfo so the upload
 * is never blocked.
 */
export function resolveFinalizedNdc(
  raw: string | null | undefined,
  additionalInfo: Record<string, unknown> = {}
): { ndc: string | null; additionalInfo: Record<string, unknown> } {
  const info = { ...additionalInfo };
  const result = parseItemCode(raw);

  if (result.status === "normalized") {
    return { ndc: result.value, additionalInfo: info };
  }

  if (result.status === "unreadable") {
    const original = raw == null ? "" : String(raw).trim();
    if (original) {
      const alreadyStored = Object.values(info).some(
        (value) => String(value).trim() === original
      );
      if (!alreadyStored) {
        info.NDC = original;
      }
    }
    return { ndc: null, additionalInfo: info };
  }

  return { ndc: null, additionalInfo: info };
}

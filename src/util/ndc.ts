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

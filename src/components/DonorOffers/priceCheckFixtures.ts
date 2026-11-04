import type { PriceCheckedItem } from "@/types/api/donorOffer.types";

// Sample data covering all five price-check statuses, extended from the
// example in issue #380. The backend doesn't send this shape yet, so this
// fixture stands in for a real Preview response — used by the dev harness
// (src/app/dev/price-check-preview) and by scripts/tests/priceCheck.test.ts.
// Typed against the real shared type, so if the backend's real shape ever
// drifts, this file stops compiling instead of silently going stale.
export const priceCheckFixture: PriceCheckedItem[] = [
  {
    row: 2,
    title: "Ramipril 5 mg capsules",
    priceCheck: {
      status: "priced",
      code: "12345-0001-01",
      codeType: "NDC",
      itemPriceId: 41,
      price: "12.00",
      priceSetOn: "2026-03-02",
      value: "480.00",
    },
  },
  {
    row: 3,
    title: "Amoxicillin 500 mg capsules",
    priceCheck: {
      status: "expired",
      code: "12345-0002-01",
      codeType: "NDC",
      itemPriceId: 42,
      price: "9.50",
      priceSetOn: "2025-08-11",
      value: null,
    },
  },
  {
    row: 4,
    title: "Bandages (box of 100)",
    priceCheck: {
      status: "missing",
      code: "036000291452",
      codeType: "UPC",
      itemPriceId: null,
      price: null,
      priceSetOn: null,
      value: null,
    },
  },
  {
    row: 5,
    title: "Gauze pads",
    priceCheck: {
      status: "no-code",
      code: null,
      codeType: null,
      itemPriceId: null,
      price: null,
      priceSetOn: null,
      value: null,
    },
  },
  {
    row: 6,
    title: "Ibuprofen 200 mg tablets",
    priceCheck: {
      status: "unreadable",
      code: "1234567890",
      codeType: null,
      itemPriceId: null,
      price: null,
      priceSetOn: null,
      value: null,
    },
  },
];

// Factory for synthetic rows in tests that don't need a specific scenario
// from priceCheckFixture above — keeps one shared shape instead of ad-hoc
// object literals scattered through the test file.
export function makePriceCheckedItem(
  status: PriceCheckedItem["priceCheck"]["status"],
  overrides: Partial<PriceCheckedItem["priceCheck"]> = {},
  itemOverrides: Partial<Pick<PriceCheckedItem, "row" | "title">> = {}
): PriceCheckedItem {
  return {
    row: 1,
    title: "Test item",
    ...itemOverrides,
    priceCheck: {
      status,
      code: null,
      codeType: null,
      itemPriceId: null,
      price: null,
      priceSetOn: null,
      value: null,
      ...overrides,
    },
  };
}

// Two rows sharing one NDC code (same medication, split across two pallets),
// both missing — exercises codesNeedingPrice's "one line per code" dedup
// with realistic, distinct titles rather than two identical synthetic rows.
export const priceCheckDuplicateCodeFixture: PriceCheckedItem[] = [
  {
    row: 10,
    title: "Amoxicillin 500 mg capsules (pallet A)",
    priceCheck: {
      status: "missing",
      code: "99999-0001-01",
      codeType: "NDC",
      itemPriceId: null,
      price: null,
      priceSetOn: null,
      value: null,
    },
  },
  {
    row: 11,
    title: "Amoxicillin 500 mg capsules (pallet B)",
    priceCheck: {
      status: "missing",
      code: "99999-0001-01",
      codeType: "NDC",
      itemPriceId: null,
      price: null,
      priceSetOn: null,
      value: null,
    },
  },
];

// A row that is blocking (missing/expired) but has no usable code — shouldn't
// happen per the shared type's contract (code is only null for no-code/
// unreadable), but priceCheck.ts guards against it defensively, so it's
// covered here too.
export const priceCheckBlockingWithoutCodeFixture: PriceCheckedItem[] = [
  {
    row: 20,
    title: "Mystery item with no code on a blocking row",
    priceCheck: {
      status: "missing",
      code: null,
      codeType: null,
      itemPriceId: null,
      price: null,
      priceSetOn: null,
      value: null,
    },
  },
];

// A row with a malformed `value`/`price` string — the backend's contract
// says these are always clean decimal text, but priceCheck.ts shouldn't let
// one bad row corrupt the whole summary (see summarize()'s Number.isFinite
// guard).
export const priceCheckMalformedValueFixture: PriceCheckedItem[] = [
  {
    row: 30,
    title: "Row with an unparseable value",
    priceCheck: {
      status: "priced",
      code: "11111-0001-01",
      codeType: "NDC",
      itemPriceId: 99,
      price: "12.00",
      priceSetOn: "2026-01-01",
      value: "not-a-number",
    },
  },
  {
    row: 31,
    title: "Row with a normal value",
    priceCheck: {
      status: "priced",
      code: "11111-0002-01",
      codeType: "NDC",
      itemPriceId: 100,
      price: "5.00",
      priceSetOn: "2026-01-01",
      value: "50.00",
    },
  },
];

// Large, generated set of rows for sanity-checking performance and dedup at
// scale: `count` distinct codes, each repeated `repeatsPerCode` times across
// the five statuses in rotation.
export function makeLargePriceCheckFixture(
  count = 500,
  repeatsPerCode = 2
): PriceCheckedItem[] {
  const statuses: PriceCheckedItem["priceCheck"]["status"][] = [
    "no-code",
    "unreadable",
    "missing",
    "expired",
    "priced",
  ];
  const items: PriceCheckedItem[] = [];
  let row = 1;

  for (let i = 0; i < count; i++) {
    const status = statuses[i % statuses.length];
    const cleanCode = `77777-${String(i).padStart(4, "0")}-01`;
    const code =
      status === "no-code" ? null : status === "unreadable" ? `unreadable-${i}` : cleanCode;
    const codeType = status === "no-code" || status === "unreadable" ? null : "NDC";
    for (let r = 0; r < repeatsPerCode; r++) {
      items.push({
        row: row++,
        title: `Bulk item ${i}`,
        priceCheck: {
          status,
          code,
          codeType,
          itemPriceId: status === "priced" || status === "expired" ? i : null,
          price: status === "priced" || status === "expired" ? "10.00" : null,
          priceSetOn: status === "priced" || status === "expired" ? "2026-01-01" : null,
          value: status === "priced" ? "100.00" : null,
        },
      });
    }
  }

  return items;
}

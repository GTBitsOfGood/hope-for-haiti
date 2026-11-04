import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidUpcCheckDigit,
  normalizeNdc,
  normalizeUpc,
  parseItemCode,
} from "../../src/util/ndc";
import {
  buildPriceCheck,
  canFinalize,
  centsToMoneyString,
  codesNeedingPrice,
  doesPriceCheckBlockFinalize,
  itemsNeedingPrice,
  moneyStringToCents,
  priceCheckErrorMessage,
  summarize,
} from "../../src/util/priceCheck";
import { itemPriceInputSchema } from "../../src/schema/itemPrice";
import { ITEM_PRICE_RECHECK_DAYS } from "../../src/util/itemPrice";
import {
  priceCheckFixture,
  priceCheckDuplicateCodeFixture,
  priceCheckBlockingWithoutCodeFixture,
  priceCheckMalformedValueFixture,
  makeLargePriceCheckFixture,
  makePriceCheckedItem,
} from "../../src/components/DonorOffers/priceCheckFixtures";
const item = makePriceCheckedItem;

const VALID_UPC = "012345678905";
const VALID_NDC = "00093-4155-73";

test("UPC-A check digit and normalizeUpc", () => {
  assert.equal(isValidUpcCheckDigit(VALID_UPC), true);
  assert.deepEqual(normalizeUpc(VALID_UPC), {
    status: "normalized",
    value: VALID_UPC,
  });
  assert.deepEqual(normalizeUpc("012345-678905"), {
    status: "normalized",
    value: VALID_UPC,
  });
  assert.deepEqual(normalizeUpc(" 0123 4567 8905 "), {
    status: "normalized",
    value: VALID_UPC,
  });
  assert.deepEqual(normalizeUpc(""), { status: "empty" });
  assert.deepEqual(normalizeUpc("   "), { status: "empty" });
  for (const value of [
    "012345678904",
    "111111111111",
    "12345678901",
    "0123456789051",
    "abcdefghijkl",
  ]) {
    assert.deepEqual(normalizeUpc(value), { status: "unreadable" }, value);
  }
});

test("parseItemCode prefers NDC, then UPC, and never guesses 10-digit or 11-digit leftovers", () => {
  assert.deepEqual(parseItemCode("0093-4155-73"), {
    status: "normalized",
    type: "NDC",
    value: VALID_NDC,
  });
  assert.deepEqual(parseItemCode(VALID_UPC), {
    status: "normalized",
    type: "UPC",
    value: VALID_UPC,
  });
  assert.deepEqual(parseItemCode(""), { status: "empty" });
  assert.deepEqual(parseItemCode("0093415573"), { status: "unreadable" });
  // 11 digits are treated as NDC (Excel dropping a UPC leading zero is left as-is)
  const elevenDigit = parseItemCode("00093415573");
  assert.equal(elevenDigit.status, "normalized");
  if (elevenDigit.status === "normalized") {
    assert.equal(elevenDigit.type, "NDC");
  }
  assert.deepEqual(normalizeNdc("0093-4155-73"), {
    status: "normalized",
    value: VALID_NDC,
  });
});

test("pricebook schema accepts a UPC and still rejects empty or unreadable codes", () => {
  const upc = itemPriceInputSchema.safeParse({
    ndc: VALID_UPC,
    unitPrice: "12.00",
  });
  assert.equal(upc.success, true);
  if (upc.success) assert.equal(upc.data.ndc, VALID_UPC);

  const dashedUpc = itemPriceInputSchema.safeParse({
    ndc: "012345-678905",
    unitPrice: "1",
  });
  assert.equal(dashedUpc.success, true);
  if (dashedUpc.success) assert.equal(dashedUpc.data.ndc, VALID_UPC);

  const empty = itemPriceInputSchema.safeParse({ ndc: "", unitPrice: "1" });
  assert.equal(empty.success, false);
  if (!empty.success) assert.match(empty.error.issues[0].message, /required/i);

  assert.equal(
    itemPriceInputSchema.safeParse({ ndc: "0093415573", unitPrice: "1" })
      .success,
    false
  );
});

test("money helpers keep exact cents", () => {
  assert.equal(moneyStringToCents("12.00"), BigInt(1200));
  assert.equal(moneyStringToCents("12"), BigInt(1200));
  assert.equal(moneyStringToCents("9.50"), BigInt(950));
  assert.equal(centsToMoneyString(BigInt(48000)), "480.00");
  assert.equal(centsToMoneyString(BigInt(0)), "0.00");
  assert.equal(centsToMoneyString(BigInt(1200) * BigInt(40)), "480.00");
});

test("each price-check status follows the ticket table, in order", () => {
  const reference = new Date("2026-11-03T00:00:00.000Z");
  const fresh = new Date("2026-03-02T00:00:00.000Z");
  const stale = new Date(
    reference.getTime() - (ITEM_PRICE_RECHECK_DAYS * 86_400_000 + 1)
  );

  assert.deepEqual(buildPriceCheck({ status: "empty" }, "", 40, undefined, reference), {
    status: "no-code",
    code: null,
    codeType: null,
    itemPriceId: null,
    price: null,
    priceSetOn: null,
    value: null,
  });

  assert.deepEqual(
    buildPriceCheck({ status: "unreadable" }, "0093415573", 40, undefined, reference),
    {
      status: "unreadable",
      code: "0093415573",
      codeType: null,
      itemPriceId: null,
      price: null,
      priceSetOn: null,
      value: null,
    }
  );

  const parsedNdc = {
    status: "normalized" as const,
    type: "NDC" as const,
    value: VALID_NDC,
  };

  assert.deepEqual(
    buildPriceCheck(parsedNdc, VALID_NDC, 40, undefined, reference),
    {
      status: "missing",
      code: VALID_NDC,
      codeType: "NDC",
      itemPriceId: null,
      price: null,
      priceSetOn: null,
      value: null,
    }
  );

  assert.equal(
    buildPriceCheck(
      parsedNdc,
      VALID_NDC,
      40,
      { id: 7, ndc: VALID_NDC, unitPrice: "0.00", updatedAt: fresh },
      reference
    ).status,
    "missing"
  );

  const expired = buildPriceCheck(
    parsedNdc,
    VALID_NDC,
    40,
    { id: 42, ndc: VALID_NDC, unitPrice: "9.50", updatedAt: stale },
    reference
  );
  assert.equal(expired.status, "expired");
  assert.equal(expired.itemPriceId, 42);
  assert.equal(expired.price, "9.50");
  assert.equal(expired.value, null);

  const priced = buildPriceCheck(
    parsedNdc,
    VALID_NDC,
    40,
    { id: 41, ndc: VALID_NDC, unitPrice: "12.00", updatedAt: fresh },
    reference
  );
  assert.deepEqual(priced, {
    status: "priced",
    code: VALID_NDC,
    codeType: "NDC",
    itemPriceId: 41,
    price: "12.00",
    priceSetOn: "2026-03-02",
    value: "480.00",
  });
});

test("only missing and expired block Finalize", () => {
  assert.equal(doesPriceCheckBlockFinalize("no-code"), false);
  assert.equal(doesPriceCheckBlockFinalize("unreadable"), false);
  assert.equal(doesPriceCheckBlockFinalize("priced"), false);
  assert.equal(doesPriceCheckBlockFinalize("missing"), true);
  assert.equal(doesPriceCheckBlockFinalize("expired"), true);
  assert.equal(
    priceCheckErrorMessage(3, "expired"),
    "Row 3: price was last updated more than a year ago"
  );
  assert.equal(
    priceCheckErrorMessage(2, "missing"),
    "Row 2: price is missing from the pricebook"
  );
});

test("canFinalize is false only when a blocking row is present", () => {
  assert.equal(canFinalize([item("priced"), item("no-code"), item("unreadable")]), true);
  assert.equal(canFinalize([item("priced"), item("missing")]), false);
  assert.equal(canFinalize([item("expired")]), false);
  assert.equal(canFinalize([]), true);
});

test("sheets with no codes at all can still be finalized", () => {
  assert.equal(canFinalize([item("no-code"), item("no-code")]), true);
});

test("summarize sums value, counts needs-price and warning rows", () => {
  const summary = summarize(priceCheckFixture);
  assert.equal(summary.valueSoFar, 480);
  assert.equal(summary.needsPriceCount, 2);
  assert.equal(summary.warningCount, 2);
});

test("codesNeedingPrice dedupes by code, only expired/missing, Price always blank", () => {
  const rows = codesNeedingPrice([
    item("expired", { code: "12345-0002-01", price: "9.50", itemPriceId: 42 }),
    item("missing", { code: "036000291452" }),
    item("missing", { code: "036000291452" }), // duplicate code, one line expected
    item("priced", { code: "12345-0001-01", price: "12.00" }), // excluded, not blocking
    item("no-code"), // excluded, no code
  ]);

  assert.deepEqual(rows, [
    { code: "12345-0002-01", name: "", price: "", oldPrice: "9.50" },
    { code: "036000291452", name: "Test item", price: "", oldPrice: "" },
  ]);
});

test("codes already in the pricebook get a blank Name and Price, with the current price under Old price", () => {
  const rows = codesNeedingPrice([
    item("expired", { code: "12345-0002-01", price: "9.50", itemPriceId: 42 }, { title: "Amoxicillin (pallet A)" }),
    item("missing", { code: "12345-0003-01", price: "0.00", itemPriceId: 43 }, { title: "Gauze pads" }),
    item("missing", { code: "12345-0004-01" }, { title: "Bandages 2x2" }),
  ]);
  assert.deepEqual(rows, [
    { code: "12345-0002-01", name: "", price: "", oldPrice: "9.50" },
    { code: "12345-0003-01", name: "", price: "", oldPrice: "0.00" },
    { code: "12345-0004-01", name: "Bandages 2x2", price: "", oldPrice: "" },
  ]);
});

test("the issue's own example payload produces the expected summary", () => {
  const summary = summarize([
    item("priced", { code: "12345-0001-01", price: "12.00", value: "480.00" }),
    item("expired", { code: "12345-0002-01", price: "9.50", value: null }),
  ]);
  assert.equal(summary.valueSoFar, 480);
  assert.equal(summary.needsPriceCount, 1);
  assert.equal(summary.warningCount, 0);
});

test("empty array is a no-op for every function", () => {
  assert.deepEqual(summarize([]), { valueSoFar: 0, needsPriceCount: 0, warningCount: 0 });
  assert.deepEqual(codesNeedingPrice([]), []);
  assert.equal(canFinalize([]), true);
});

test("summarize ignores a malformed value string instead of letting it poison the whole total", () => {
  // priceCheckMalformedValueFixture: one priced row with value "not-a-number"
  // ($12.00 x some quantity would normally produce a numeric value string),
  // one normal priced row worth 50.00. Without the Number.isFinite guard in
  // summarize(), NaN + 50 === NaN would wipe out the entire running total.
  const summary = summarize(priceCheckMalformedValueFixture);
  assert.equal(summary.valueSoFar, 50);
  assert.equal(Number.isNaN(summary.valueSoFar), false);
});

test("summarize treats a negative-looking value string as plain arithmetic, not a crash", () => {
  const summary = summarize([
    item("priced", { value: "-5.00" }),
    item("priced", { value: "10.00" }),
  ]);
  assert.equal(summary.valueSoFar, 5);
});

test("codesNeedingPrice skips a blocking row with no usable code", () => {
  // Shouldn't happen per the shared type's contract (code is null only for
  // no-code/unreadable), but codesNeedingPrice guards against it so a
  // malformed backend row can't produce a blank/undefined CSV line.
  assert.deepEqual(codesNeedingPrice(priceCheckBlockingWithoutCodeFixture), []);
  assert.deepEqual(
    codesNeedingPrice([...priceCheckBlockingWithoutCodeFixture, item("missing", { code: "1" })]),
    [{ code: "1", name: "Test item", price: "", oldPrice: "" }]
  );
});

test("codesNeedingPrice dedupes real fixture rows that share one NDC across two pallets", () => {
  const rows = codesNeedingPrice(priceCheckDuplicateCodeFixture);
  assert.deepEqual(rows, [
    { code: "99999-0001-01", name: "Amoxicillin 500 mg capsules (pallet A)", price: "", oldPrice: "" },
  ]);
});

test("codesNeedingPrice keeps the first occurrence's name/price when the same code appears under different statuses", () => {
  // Shouldn't happen in real data (the same code should resolve to one
  // status per Preview run), but documents the current first-wins behavior
  // rather than leaving it undefined.
  const rows = codesNeedingPrice([
    item("expired", { code: "X", price: "9.50", itemPriceId: 42 }, { title: "First seen" }),
    item("missing", { code: "X" }, { title: "Second seen" }),
  ]);
  assert.deepEqual(rows, [{ code: "X", name: "", price: "", oldPrice: "9.50" }]);
});

test("codesNeedingPrice passes the old price through unchanged, including whitespace/odd formatting", () => {
  const rows = codesNeedingPrice([item("expired", { code: "X", price: " 9.50 ", itemPriceId: 42 })]);
  assert.deepEqual(rows, [{ code: "X", name: "", price: "", oldPrice: " 9.50 " }]);
});

test("the Download list writes UPCs with spaces so Excel keeps the leading zero, and the upload reads them back", () => {
  const rows = codesNeedingPrice([
    item("missing", { code: "12345-0002-01", codeType: "NDC" }),
    item("missing", { code: "036000291452", codeType: "UPC" }),
  ]);
  assert.deepEqual(rows.map((row) => row.code), ["12345-0002-01", "0 36000 29145 2"]);
  assert.deepEqual(parseItemCode("0 36000 29145 2"), {
    status: "normalized",
    type: "UPC",
    value: "036000291452",
  });
});

test("a large, mixed-status sheet dedupes correctly and stays finite", () => {
  const large = makeLargePriceCheckFixture(500, 2);
  assert.equal(large.length, 1000);

  const summary = summarize(large);
  // statuses rotate evenly across 5 buckets over 500 unique codes, each
  // repeated twice: 100 missing codes + 100 expired codes => 200 unique
  // codes x 2 rows = 400 blocking rows.
  assert.equal(summary.needsPriceCount, 400);
  assert.equal(summary.warningCount, 400); // 100 no-code + 100 unreadable, x2
  assert.equal(canFinalize(large), false);

  const rows = codesNeedingPrice(large);
  assert.equal(rows.length, 200); // deduped: one line per unique missing/expired code
  assert.ok(rows.every((r) => r.code.startsWith("77777-")));
});

test("the Add prices form and the Download list ask about the same codes, once each", () => {
  const items = [
    item("priced", { code: "12345-0001-01", price: "12.00", itemPriceId: 41 }, { row: 1 }),
    item("expired", { code: "12345-0002-01", price: "9.50", itemPriceId: 42 }, { row: 2 }),
    item("missing", { code: "036000291452" }, { row: 3 }),
    item("expired", { code: "12345-0002-01", price: "9.50", itemPriceId: 42 }, { row: 4 }),
    item("missing", { code: "036000291452" }, { row: 5 }),
    item("no-code", {}, { row: 6 }),
    item("unreadable", { code: "0093415573" }, { row: 7 }),
  ];
  const steps = itemsNeedingPrice(items);

  assert.deepEqual(steps.map((step) => step.row), [2, 3]);
  assert.equal(steps[0], items[1]);
  assert.deepEqual(
    codesNeedingPrice(items).map((line) => line.code),
    steps.map((step) => step.priceCheck.code)
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  canFinalize,
  codesNeedingPrice,
  isBlockingStatus,
  summarize,
} from "../../src/util/priceCheck";
import {
  priceCheckFixture,
  priceCheckDuplicateCodeFixture,
  priceCheckBlockingWithoutCodeFixture,
  priceCheckMalformedValueFixture,
  makeLargePriceCheckFixture,
  makePriceCheckedItem,
} from "../../src/components/DonorOffers/priceCheckFixtures";
const item = makePriceCheckedItem;

test("only missing and expired are blocking statuses", () => {
  assert.equal(isBlockingStatus("missing"), true);
  assert.equal(isBlockingStatus("expired"), true);
  assert.equal(isBlockingStatus("no-code"), false);
  assert.equal(isBlockingStatus("unreadable"), false);
  assert.equal(isBlockingStatus("priced"), false);
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

test("codesNeedingPrice dedupes by code, only expired/missing, blank price for missing", () => {
  const rows = codesNeedingPrice([
    item("expired", { code: "12345-0002-01", price: "9.50" }),
    item("missing", { code: "036000291452" }),
    item("missing", { code: "036000291452" }), // duplicate code, one line expected
    item("priced", { code: "12345-0001-01", price: "12.00" }), // excluded, not blocking
    item("no-code"), // excluded, no code
  ]);

  assert.deepEqual(rows, [
    { code: "12345-0002-01", name: "Test item", price: "9.50" },
    { code: "036000291452", name: "Test item", price: "" },
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
    [{ code: "1", name: "Test item", price: "" }]
  );
});

test("codesNeedingPrice dedupes real fixture rows that share one NDC across two pallets", () => {
  const rows = codesNeedingPrice(priceCheckDuplicateCodeFixture);
  assert.deepEqual(rows, [
    { code: "99999-0001-01", name: "Amoxicillin 500 mg capsules (pallet A)", price: "" },
  ]);
});

test("codesNeedingPrice keeps the first occurrence's name/price when the same code appears under different statuses", () => {
  // Shouldn't happen in real data (the same code should resolve to one
  // status per Preview run), but documents the current first-wins behavior
  // rather than leaving it undefined.
  const rows = codesNeedingPrice([
    item("expired", { code: "X", price: "9.50" }, { title: "First seen" }),
    item("missing", { code: "X" }, { title: "Second seen" }),
  ]);
  assert.deepEqual(rows, [{ code: "X", name: "First seen", price: "9.50" }]);
});

test("codesNeedingPrice passes price strings through unchanged, including whitespace/odd formatting", () => {
  const rows = codesNeedingPrice([item("expired", { code: "X", price: " 9.50 " })]);
  assert.deepEqual(rows, [{ code: "X", name: "Test item", price: " 9.50 " }]);
});

test("NDC and UPC codes are treated identically by the pure logic (codeType isn't consulted)", () => {
  const rows = codesNeedingPrice([
    item("missing", { code: "ndc-1", codeType: "NDC" }),
    item("missing", { code: "upc-1", codeType: "UPC" }),
  ]);
  assert.deepEqual(rows, [
    { code: "ndc-1", name: "Test item", price: "" },
    { code: "upc-1", name: "Test item", price: "" },
  ]);
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

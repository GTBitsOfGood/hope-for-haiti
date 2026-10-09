import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalizeNdc,
  isCanonicalNdc,
  isValidMoneyString,
  needsItemPriceRecheck,
  parseItemPriceListQuery,
  parsePositivePriceId,
  ITEM_PRICE_RECHECK_DAYS,
  MAX_INT32_ID,
} from "../../src/util/itemPrice";
import { itemPriceInputSchema } from "../../src/schema/itemPrice";

const validInput = (ndc: string, unitPrice: string) => ({ ndc, unitPrice });

test("price resource IDs require positive signed 32-bit integers", () => {
  assert.equal(parsePositivePriceId("1"), 1);
  assert.equal(parsePositivePriceId(String(MAX_INT32_ID)), MAX_INT32_ID);
  for (const value of ["", "0", "-1", "+1", "1x", "1.0", " 1", "2147483648", "999999999999999999999999", "Infinity", "NaN"]) {
    assert.equal(parsePositivePriceId(value), null, value);
  }
});

test("list query has stable defaults, validates ranges, filters and safe offsets", () => {
  assert.deepEqual(parseItemPriceListQuery(new URLSearchParams()), { page: 1, pageSize: 10, ndcFilter: undefined });
  assert.deepEqual(parseItemPriceListQuery(new URLSearchParams("filters={}")), { page: 1, pageSize: 10, ndcFilter: undefined });
  for (const query of ["filters=", "filters=%20%20"]) {
    assert.throws(() => parseItemPriceListQuery(new URLSearchParams(query)), { message: "Filters must be valid JSON." });
  }
  assert.deepEqual(parseItemPriceListQuery(new URLSearchParams("page=2&pageSize=100&filters=%7B%22ndc%22%3A%7B%22type%22%3A%22string%22%2C%22value%22%3A%20%22%20abc%20%22%7D%7D")), { page: 2, pageSize: 100, ndcFilter: "abc" });
  assert.deepEqual(parseItemPriceListQuery(new URLSearchParams("filters=%7B%22ndc%22%3A%7B%22type%22%3A%22string%22%2C%22value%22%3A%22%20%20%22%7D%7D")), { page: 1, pageSize: 10, ndcFilter: undefined });
  for (const query of ["page=0", "page=-1", "page=1.2", "page=Infinity", "page=9007199254740992", "page=2147483647&pageSize=100", "pageSize=101", "pageSize=0", "filters=%7B", "filters=%7B%22other%22%3A1%7D", "filters=%7B%22ndc%22%3A%7B%22type%22%3A%22number%22%2C%22value%22%3A%221%22%7D%7D", "filters=%7B%22ndc%22%3A%7B%22type%22%3A%22string%22%2C%22value%22%3A%221%22%2C%22extra%22%3A1%7D%7D"]) {
    assert.throws(() => parseItemPriceListQuery(new URLSearchParams(query)), query);
  }
});

test("NDC boundary accepts canonical values and deliberately rejects noncanonical formats", () => {
  assert.equal(isCanonicalNdc("00093-4155-73"), true);
  assert.equal(canonicalizeNdc(" 00093-4155-73 "), "00093-4155-73");
  for (const value of ["", "  ", "00093415573", "0093-4155-73", "00093-415573", "00093 4155 73", "00093-4155-73-00", "bad"]) {
    assert.equal(isCanonicalNdc(value.trim()), false, value);
    assert.equal(itemPriceInputSchema.safeParse(validInput(value, "1")).success, false, value);
  }
  for (const value of [null, undefined, 42]) assert.throws(() => canonicalizeNdc(value));
});

test("money validation uses exact cents and the signed PostgreSQL MONEY bound", () => {
  for (const value of ["0", "0.0", "0.10", "19.99", "1000000000", "92233720368547758.07"]) {
    assert.equal(isValidMoneyString(value), true, value);
    assert.equal(itemPriceInputSchema.safeParse(validInput("00093-4155-73", value)).success, true, value);
  }
  for (const value of ["92233720368547758.08", "-1", "+1", "01", "00.10", "00.50", ".10", "1.", "1.234", "1e2", "NaN", "Infinity", "$2", "1,000", " 1 ", "9".repeat(33)]) {
    assert.equal(isValidMoneyString(value), false, value);
    assert.equal(itemPriceInputSchema.safeParse(validInput("00093-4155-73", value)).success, false, value);
  }
  assert.equal(itemPriceInputSchema.safeParse(validInput("00093-4155-73", "2.00")).success, true);
  assert.equal(itemPriceInputSchema.safeParse({ ...validInput("00093-4155-73", "2.00"), enteredById: 1 }).success, false);
});

test("staleness uses updatedAt and strict elapsed-day cutoff across dates and zones", () => {
  const reference = new Date("2024-03-01T00:00:00.000Z");
  const cutoff = reference.getTime() - ITEM_PRICE_RECHECK_DAYS * 86_400_000;
  assert.equal(needsItemPriceRecheck(new Date(cutoff), reference), false);
  assert.equal(needsItemPriceRecheck(new Date(cutoff - 1), reference), true);
  assert.equal(needsItemPriceRecheck(new Date(cutoff + 1), reference), false);
  assert.equal(needsItemPriceRecheck("2023-03-01T00:00:00-05:00", new Date("2024-03-01T05:00:00Z")), true);
  assert.equal(needsItemPriceRecheck("2024-03-01T00:00:00+14:00", reference), false);
  assert.equal(needsItemPriceRecheck("not a date", reference), false);
  assert.equal(needsItemPriceRecheck("2023-02-28T00:00:00Z", new Date("2024-02-29T00:00:00Z")), true);
});

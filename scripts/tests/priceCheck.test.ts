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
  centsToMoneyString,
  doesPriceCheckBlockFinalize,
  moneyStringToCents,
  priceCheckErrorMessage,
} from "../../src/util/priceCheck";
import { itemPriceInputSchema } from "../../src/schema/itemPrice";
import { ITEM_PRICE_RECHECK_DAYS } from "../../src/util/itemPrice";

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

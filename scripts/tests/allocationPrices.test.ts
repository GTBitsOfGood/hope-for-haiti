import test from "node:test";
import assert from "node:assert/strict";
import {
  describeLinePrices,
  describeSavedValue,
} from "../../src/util/allocationPrices";
import { formatMoney } from "../../src/util/format";

test("formatMoney shows money strings with commas and cents", () => {
  assert.equal(formatMoney("1234.5"), "$1,234.50");
  assert.equal(formatMoney("0"), "$0.00");
  assert.equal(formatMoney("1234567.89"), "$1,234,567.89");
});

test("describeLinePrices gives one price, a range, or nothing", () => {
  assert.equal(describeLinePrices(["12.00", "12"]), "$12.00");
  assert.equal(
    describeLinePrices(["14.5", "12.00", null, "12.00"]),
    "$12.00 to $14.50"
  );
  assert.equal(describeLinePrices([null, undefined]), null);
  assert.equal(describeLinePrices([]), null);
});

test("describeSavedValue adds saved price × containers over priced lines only", () => {
  // 2 × $12.00 + 3 × $0.10 = $24.30 exactly (whole cents, no float drift)
  assert.equal(
    describeSavedValue([
      { quantity: 2, savedUnitPrice: "12.00" },
      { quantity: 3, savedUnitPrice: "0.10" },
    ]),
    "$24.30"
  );
  // A line with no saved price is left out, never counted as $0.00
  assert.equal(
    describeSavedValue([
      { quantity: 2, savedUnitPrice: "12.00" },
      { quantity: 5, savedUnitPrice: null },
    ]),
    "$24.00"
  );
  assert.equal(
    describeSavedValue([{ quantity: 5, savedUnitPrice: null }, { quantity: 1 }]),
    null
  );
  assert.equal(describeSavedValue([]), null);
});

import test from "node:test";
import assert from "node:assert/strict";
import type { ZodIssue } from "zod";
import { describeRowIssues, headerForField } from "../../src/services/fileService";
import { unreadableCodeMessage } from "../../src/util/ndc";
import { validateCodeOverride } from "../../src/util/priceCheck";

test("row errors name the file's column, not the code's field", () => {
  assert.equal(headerForField("unfinalized", "weight"), "UOM Weight Lb");
  assert.equal(headerForField("unfinalized", "initialQuantity"), "Quantity");
  assert.equal(headerForField("finalized", "quantity"), "# of Containers");
  assert.equal(headerForField("finalized", "unitPrice"), "Cost per Piece");
  assert.equal(headerForField("finalized", "notAColumn"), undefined);
});

test("text in a number column says 'must be a number', even when parsing emptied it", () => {
  // Create: Number("abc") is NaN, so the schema reports received "nan".
  assert.equal(
    describeRowIssues("unfinalized", 4, { weight: "abc" }, [
      {
        code: "invalid_type",
        expected: "number",
        received: "nan",
        path: ["weight"],
        message: "Expected number, received nan",
      } as ZodIssue,
    ]),
    'Row 4: "UOM Weight Lb" must be a number (you entered "abc").'
  );
  // Finalize: coerceNumber turns "six" into undefined, so the schema says "Required".
  assert.equal(
    describeRowIssues("finalized", 3, { quantity: "six" }, [
      {
        code: "invalid_type",
        expected: "number",
        received: "undefined",
        path: ["quantity"],
        message: "Required",
      } as ZodIssue,
    ]),
    'Row 3: "# of Containers" must be a number (you entered "six").'
  );
});

test("empty cells say 'is required', and several problems share one row line", () => {
  assert.equal(
    describeRowIssues("finalized", 5, { quantity: "", unitPrice: "-1" }, [
      {
        code: "invalid_type",
        expected: "number",
        received: "undefined",
        path: ["quantity"],
        message: "Required",
      } as ZodIssue,
      {
        code: "too_small",
        minimum: 0,
        inclusive: true,
        type: "number",
        path: ["unitPrice"],
        message: "Number must be greater than or equal to 0",
      } as ZodIssue,
    ]),
    'Row 5: "# of Containers" is required; "Cost per Piece" can\'t be negative.'
  );
});

test("unreadable codes get the 10-digit hint only for 10 undashed digits", () => {
  assert.match(unreadableCodeMessage("0093415573"), /10-digit/);
  assert.equal(
    unreadableCodeMessage("abc"),
    "Enter an NDC (like 00093-4155-73) or a 12-digit UPC."
  );
  const override = validateCodeOverride(null, "abc");
  assert.equal(override.status, "error");
  if (override.status === "error") assert.doesNotMatch(override.message, /10-digit/);
});

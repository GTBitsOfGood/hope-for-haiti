import test from "node:test";
import assert from "node:assert/strict";
import {
  formatItemPriceMoney,
  isPositiveMoneyString,
  isValidMoneyString,
  needsItemPriceRecheck,
  parseItemPriceListQuery,
  parsePositivePriceId,
  ITEM_PRICE_RECHECK_DAYS,
  MAX_INT32_ID,
} from "../../src/util/itemPrice";
import {
  buildItemPriceUploadReview,
  getItemPriceUploadCodes,
} from "../../src/util/itemPriceUpload";
import { itemPriceInputSchema } from "../../src/schema/itemPrice";
import { normalizeNdc } from "../../src/util/ndc";
import FileService from "../../src/services/fileService";
import * as XLSX from "xlsx";

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
  for (const [raw, expected] of [["0093-4155-73", "00093-4155-73"], ["00093-415-573", "00093-415-573"], ["00093-4155-7", "00093-4155-07"], ["12345-678-90", "12345-0678-90"], ["12345-6789-0", "12345-6789-00"], ["00093415573", "00093-4155-73"], ["00093-4155-73", "00093-4155-73"], [" 00093-4155-73 ", "00093-4155-73"]]) {
    const filters = JSON.stringify({ ndc: { type: "string", value: raw } });
    assert.equal(parseItemPriceListQuery(new URLSearchParams(`filters=${encodeURIComponent(filters)}`)).ndcFilter, expected);
  }
  for (const raw of ["abc", "0093", "0009341557"]) {
    const filters = JSON.stringify({ ndc: { type: "string", value: raw } });
    assert.equal(parseItemPriceListQuery(new URLSearchParams(`filters=${encodeURIComponent(filters)}`)).ndcFilter, raw);
  }
  for (const query of ["filters=", "filters=%20%20"]) {
    assert.throws(() => parseItemPriceListQuery(new URLSearchParams(query)), { message: "Filters must be valid JSON." });
  }
  assert.deepEqual(parseItemPriceListQuery(new URLSearchParams("page=2&pageSize=100&filters=%7B%22ndc%22%3A%7B%22type%22%3A%22string%22%2C%22value%22%3A%20%22%20abc%20%22%7D%7D")), { page: 2, pageSize: 100, ndcFilter: "abc" });
  assert.deepEqual(parseItemPriceListQuery(new URLSearchParams("filters=%7B%22ndc%22%3A%7B%22type%22%3A%22string%22%2C%22value%22%3A%22%20%20%22%7D%7D")), { page: 1, pageSize: 10, ndcFilter: undefined });
  for (const query of ["page=0", "page=-1", "page=1.2", "page=Infinity", "page=9007199254740992", "page=2147483647&pageSize=100", "pageSize=101", "pageSize=0", "filters=%7B", "filters=%7B%22other%22%3A1%7D", "filters=%7B%22ndc%22%3A%7B%22type%22%3A%22number%22%2C%22value%22%3A%221%22%7D%7D", "filters=%7B%22ndc%22%3A%7B%22type%22%3A%22string%22%2C%22value%22%3A%221%22%2C%22extra%22%3A1%7D%7D"]) {
    assert.throws(() => parseItemPriceListQuery(new URLSearchParams(query)), query);
  }
});

test("NDC schema safely normalizes recognized formats and rejects empty or unreadable input", () => {
  const variants: [string, string][] = [["0093-4155-73", "00093-4155-73"], ["12345-678-90", "12345-0678-90"], ["12345-6789-0", "12345-6789-00"], ["00093415573", "00093-4155-73"], ["00093-4155-73", "00093-4155-73"], [" 00093-4155-73 ", "00093-4155-73"], ["00093-4155-7", "00093-4155-07"]];
  for (const [raw, expected] of variants) {
    const result = itemPriceInputSchema.safeParse(validInput(raw, "1"));
    assert.equal(result.success, true, raw);
    if (result.success) {
      assert.equal(result.data.ndc, expected, raw);
      assert.deepEqual(normalizeNdc(result.data.ndc), { status: "normalized", value: expected });
    }
  }
  assert.deepEqual(normalizeNdc(null), { status: "empty" });
  assert.deepEqual(normalizeNdc(undefined), { status: "empty" });
  for (const value of ["", "  "]) {
    const result = itemPriceInputSchema.safeParse(validInput(value, "1"));
    assert.equal(result.success, false);
    if (!result.success) assert.match(result.error.issues[0].message, /required/i);
  }
  for (const value of ["0009341557", "0093415573", "00093-415573", "00093 4155 73", "00093-4155-73-00", "bad"]) {
    assert.doesNotThrow(() => itemPriceInputSchema.safeParse(validInput(value, "1")));
    assert.equal(itemPriceInputSchema.safeParse(validInput(value, "1")).success, false, value);
  }
  for (const ndc of [null, undefined, false, 42, [], {}]) {
    assert.doesNotThrow(() => itemPriceInputSchema.safeParse({ ndc, unitPrice: "1" }));
    assert.equal(itemPriceInputSchema.safeParse({ ndc, unitPrice: "1" }).success, false);
  }
});

test("optional names trim, clear on blank, and reject non-string values", () => {
  const named = itemPriceInputSchema.safeParse({ ...validInput("00093-4155-73", "1"), name: "  Amoxicillin 500 mg  " });
  assert.equal(named.success, true);
  if (named.success) assert.equal(named.data.name, "Amoxicillin 500 mg");

  for (const value of ["", "   ", null]) {
    const result = itemPriceInputSchema.safeParse({ ...validInput("00093-4155-73", "1"), name: value });
    assert.equal(result.success, true, String(value));
    if (result.success) assert.equal(result.data.name, null);
  }

  const omitted = itemPriceInputSchema.safeParse(validInput("00093-4155-73", "1"));
  assert.equal(omitted.success, true);
  if (omitted.success) assert.equal(omitted.data.name, undefined);

  for (const value of [42, false, [], {}]) {
    assert.equal(itemPriceInputSchema.safeParse({ ...validInput("00093-4155-73", "1"), name: value }).success, false);
  }
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
  assert.equal(itemPriceInputSchema.safeParse({ ...validInput("00093-4155-73", "2.00"), createdAt: new Date() }).success, false);
  assert.equal(itemPriceInputSchema.safeParse({ ...validInput("00093-4155-73", "2.00"), updatedAt: new Date() }).success, false);
});

test("upload review sorts new, changed, same, skipped, duplicate, and problem lines", () => {
  const viewer = buildItemPriceUploadReview(
    [
      { lineNumber: 2, code: "0093-4155-73", name: "", price: "12.5" },
      { lineNumber: 3, code: "00002-8215-01", name: "Amoxicillin", price: "2" },
      { lineNumber: 4, code: "11111-1111-11", name: "New name", price: "1.00" },
      { lineNumber: 5, code: "22222-2222-22", name: "Ignored", price: "  " },
      { lineNumber: 6, code: "bad", name: "Bad code", price: "1.00" },
      { lineNumber: 7, code: "33333-3333-33", name: "Free", price: "0.00" },
      { lineNumber: 8, code: "4444-4444-44", name: "First", price: "1.00" },
      { lineNumber: 9, code: "04444-4444-44", name: "Second", price: "2.00" },
      { lineNumber: 10, code: "55555-5555-55", name: {}, price: "1.00" },
    ],
    [
      {
        id: 1,
        ndc: "00093-4155-73",
        name: "Aspirin",
        unitPrice: "12.50",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: 2,
        ndc: "11111-1111-11",
        name: "Old name",
        unitPrice: "1.00",
        updatedAt: "2024-01-02T00:00:00.000Z",
      },
    ]
  );

  assert.deepEqual(viewer.counts, {
    new: 1,
    changed: 1,
    same: 1,
    problems: 5,
    skipped: 1,
  });
  assert.equal(viewer.totalRows, 9);

  const same = viewer.groups.same[0];
  assert.equal(same.lineNumber, 2);
  assert.equal(same.code, "00093-4155-73");
  assert.equal(same.name, "Aspirin");
  assert.equal(same.price, "12.50");
  assert.deepEqual(same.old, {
    id: 1,
    name: "Aspirin",
    unitPrice: "12.50",
    updatedAt: "2024-01-01T00:00:00.000Z",
  });

  const changed = viewer.groups.changed[0];
  assert.equal(changed.lineNumber, 4);
  assert.equal(changed.name, "New name");
  assert.deepEqual(changed.old, {
    id: 2,
    name: "Old name",
    unitPrice: "1.00",
    updatedAt: "2024-01-02T00:00:00.000Z",
  });

  assert.equal(viewer.groups.new[0].lineNumber, 3);
  assert.equal(viewer.groups.new[0].code, "00002-8215-01");
  assert.equal(viewer.groups.new[0].name, "Amoxicillin");
  assert.equal(viewer.groups.new[0].price, "2.00");

  const duplicateLines = viewer.groups.problems
    .filter((line) => line.lineNumber === 8 || line.lineNumber === 9)
    .map((line) => line.lineNumber);
  assert.deepEqual(duplicateLines, [8, 9]);
  assert.ok(
    viewer.groups.problems
      .find((line) => line.lineNumber === 8)
      ?.reasons.some((reason) => reason.includes("appears more than once"))
  );
  assert.ok(
    viewer.groups.problems
      .find((line) => line.lineNumber === 7)
      ?.reasons.some((reason) => reason.includes("greater than zero"))
  );
  assert.deepEqual(getItemPriceUploadCodes([
    { lineNumber: 2, code: "0093-4155-73", name: undefined, price: "1" },
    { lineNumber: 3, code: "00093415573", name: undefined, price: "1" },
  ]), ["00093-4155-73"]);
});

test("pricebook parser accepts loose CSV headers, ignores extras, and keeps line numbers", async () => {
  const file = new File(
    [
      "\uFEFFCODE , Name , Price , Notes\n",
      "0093-4155-73,Amoxicillin,12.5,first\n",
      "\n",
      "12345-678-90,,1.00,second\n",
    ],
    "prices.csv",
    { type: "text/csv" }
  );
  const parsed = await FileService.parsePricebookFile(file);
  assert.deepEqual(parsed.fields, ["code", "name", "price", "notes"]);
  assert.deepEqual(parsed.rows, [
    { lineNumber: 2, code: "0093-4155-73", name: "Amoxicillin", price: "12.5" },
    { lineNumber: 4, code: "12345-678-90", name: "", price: "1.00" },
  ]);
});

test("pricebook parser rejects duplicate recognized headers and keeps physical CSV line numbers", async () => {
  const duplicate = new File(
    ["Code,Price,Price_1\n00093-4155-73,1.00,2.00\n"],
    "duplicate.csv",
    { type: "text/csv" }
  );
  await assert.rejects(
    () => FileService.parsePricebookFile(duplicate),
    /duplicate recognized columns/i
  );

  const multiline = new File(
    [
      "Code,Name,Price\n",
      '0093-4155-73,"multi\nline",12.5\n',
      "12345-678-90,Second,1.00\n",
    ],
    "multiline.csv",
    { type: "text/csv" }
  );
  const parsed = await FileService.parsePricebookFile(multiline);
  assert.deepEqual(
    parsed.rows.map((row) => ({ lineNumber: row.lineNumber, code: row.code })),
    [
      { lineNumber: 2, code: "0093-4155-73" },
      { lineNumber: 4, code: "12345-678-90" },
    ]
  );
});

test("pricebook parser keeps raw numeric Excel prices even when formatted as currency", async () => {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Code", "Name", "Price"],
    ["0093-4155-73", "Amoxicillin", 12.5],
  ]);
  sheet.C2.z = '"$"#,##0.00';
  XLSX.utils.book_append_sheet(workbook, sheet, "Prices");
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const file = new File([buffer], "prices.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const parsed = await FileService.parsePricebookFile(file);
  assert.deepEqual(parsed.rows, [
    { lineNumber: 2, code: "0093-4155-73", name: "Amoxicillin", price: 12.5 },
  ]);
});

test("money formatting and positive-only checks use exact cents", () => {
  assert.equal(formatItemPriceMoney("12.5"), "12.50");
  assert.equal(formatItemPriceMoney("0"), "0.00");
  assert.equal(isPositiveMoneyString("0.00"), false);
  assert.equal(isPositiveMoneyString("0.01"), true);
  assert.equal(isPositiveMoneyString("92233720368547758.07"), true);
  assert.throws(() => formatItemPriceMoney("1.234"));
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

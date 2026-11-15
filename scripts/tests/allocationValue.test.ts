import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAllocationValueSummary,
  type AllocationValueLine,
} from "../../src/util/allocationValue";

const line = (
  partial: Partial<AllocationValueLine> &
    Pick<AllocationValueLine, "quantity" | "savedUnitPrice">
): AllocationValueLine => ({
  partner: null,
  ...partial,
});

test("splits value by partner at saved prices", () => {
  const summary = buildAllocationValueSummary([
    line({
      quantity: 2,
      savedUnitPrice: "10.00",
      partner: { id: 1, name: "Hope Medical Center" },
    }),
    line({
      quantity: 1,
      savedUnitPrice: "5.50",
      partner: { id: 2, name: "Les Cayes Community Hospital" },
    }),
  ]);

  assert.deepEqual(summary.partners, [
    {
      partnerId: 1,
      partnerName: "Hope Medical Center",
      value: "20.00",
      unpricedCount: 0,
    },
    {
      partnerId: 2,
      partnerName: "Les Cayes Community Hospital",
      value: "5.50",
      unpricedCount: 0,
    },
  ]);
  assert.deepEqual(summary.notAllocated, { value: "0.00", unpricedCount: 0 });
  assert.equal(summary.total, "25.50");
  assert.equal(summary.unpricedCount, 0);
  assert.equal(summary.hasSavedPrices, true);
});

test("unallocated priced lines go under Not allocated", () => {
  const summary = buildAllocationValueSummary([
    line({ quantity: 3, savedUnitPrice: "4.00" }),
    line({
      quantity: 1,
      savedUnitPrice: "2.00",
      partner: { id: 1, name: "Hope Medical Center" },
    }),
  ]);

  assert.equal(summary.partners[0]?.value, "2.00");
  assert.deepEqual(summary.notAllocated, { value: "12.00", unpricedCount: 0 });
  assert.equal(summary.total, "14.00");
});

test("partners plus Not allocated equal the offer total when all priced", () => {
  const summary = buildAllocationValueSummary([
    line({
      quantity: 2,
      savedUnitPrice: "12.50",
      partner: { id: 1, name: "A" },
    }),
    line({
      quantity: 1,
      savedUnitPrice: "7.25",
      partner: { id: 2, name: "B" },
    }),
    line({ quantity: 4, savedUnitPrice: "1.00" }),
  ]);

  const partnerCents = summary.partners.reduce(
    (sum, partner) => sum + Number(partner.value),
    0
  );
  assert.equal(
    (partnerCents + Number(summary.notAllocated.value)).toFixed(2),
    summary.total
  );
  assert.equal(summary.total, "36.25");
});

test("exact cents: 12.50 * 3 is 37.50", () => {
  const summary = buildAllocationValueSummary([
    line({ quantity: 3, savedUnitPrice: "12.50" }),
  ]);
  assert.equal(summary.notAllocated.value, "37.50");
  assert.equal(summary.total, "37.50");
});

test("unpriced lines are flagged and never counted as 0.00", () => {
  const summary = buildAllocationValueSummary([
    line({
      quantity: 10,
      savedUnitPrice: null,
      partner: { id: 1, name: "Hope Medical Center" },
    }),
    line({ quantity: 2, savedUnitPrice: null }),
    line({
      quantity: 1,
      savedUnitPrice: "8.00",
      partner: { id: 1, name: "Hope Medical Center" },
    }),
  ]);

  assert.deepEqual(summary.partners, [
    {
      partnerId: 1,
      partnerName: "Hope Medical Center",
      value: "8.00",
      unpricedCount: 1,
    },
  ]);
  assert.deepEqual(summary.notAllocated, { value: "0.00", unpricedCount: 1 });
  assert.equal(summary.total, "8.00");
  assert.equal(summary.unpricedCount, 2);
  assert.equal(summary.hasSavedPrices, true);
});

test("moving a line reshuffles partner and Not allocated buckets", () => {
  const before = buildAllocationValueSummary([
    line({
      quantity: 2,
      savedUnitPrice: "10.00",
      partner: { id: 1, name: "A" },
    }),
    line({ quantity: 1, savedUnitPrice: "10.00" }),
  ]);
  assert.equal(before.partners[0]?.value, "20.00");
  assert.equal(before.notAllocated.value, "10.00");
  assert.equal(before.total, "30.00");

  const afterMove = buildAllocationValueSummary([
    line({
      quantity: 2,
      savedUnitPrice: "10.00",
      partner: { id: 1, name: "A" },
    }),
    line({
      quantity: 1,
      savedUnitPrice: "10.00",
      partner: { id: 2, name: "B" },
    }),
  ]);
  assert.equal(afterMove.partners.find((p) => p.partnerId === 1)?.value, "20.00");
  assert.equal(afterMove.partners.find((p) => p.partnerId === 2)?.value, "10.00");
  assert.equal(afterMove.notAllocated.value, "0.00");
  assert.equal(afterMove.total, "30.00");

  const afterRemove = buildAllocationValueSummary([
    line({
      quantity: 2,
      savedUnitPrice: "10.00",
      partner: { id: 1, name: "A" },
    }),
    line({ quantity: 1, savedUnitPrice: "10.00" }),
  ]);
  assert.equal(afterRemove.partners[0]?.value, "20.00");
  assert.equal(afterRemove.notAllocated.value, "10.00");
  assert.equal(afterRemove.total, "30.00");
});

test("offers with no saved prices report hasSavedPrices false", () => {
  const summary = buildAllocationValueSummary([
    line({ quantity: 1, savedUnitPrice: null }),
    line({
      quantity: 2,
      savedUnitPrice: null,
      partner: { id: 1, name: "A" },
    }),
  ]);

  assert.equal(summary.hasSavedPrices, false);
  assert.equal(summary.total, "0.00");
  assert.equal(summary.unpricedCount, 2);
  assert.equal(summary.partners[0]?.unpricedCount, 1);
  assert.equal(summary.notAllocated.unpricedCount, 1);
});

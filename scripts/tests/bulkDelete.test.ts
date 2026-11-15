import test from "node:test";
import assert from "node:assert/strict";
import { parseBulkDeleteIds } from "../../src/util/itemPrice";
import { ItemPriceService } from "../../src/services/itemPriceService";

const idsPayload = (ids: unknown[]) => ({ ids });

test("bulk delete ids parse, dedupe, and cap", () => {
  assert.deepEqual(parseBulkDeleteIds(idsPayload(["1", 2, "2", "0003"])), [1, 2, 3]);
  assert.deepEqual(parseBulkDeleteIds(idsPayload([2147483647])), [2147483647]);
  assert.throws(() => parseBulkDeleteIds(idsPayload([])), /At least one/);
  assert.throws(() => parseBulkDeleteIds({}), /ids array/);
  assert.throws(() => parseBulkDeleteIds(idsPayload(["abc"])), /positive 32-bit/);
  assert.throws(() => parseBulkDeleteIds(idsPayload([0])), /positive 32-bit/);
  assert.throws(() => parseBulkDeleteIds(idsPayload([-1])), /positive 32-bit/);
  assert.throws(() => parseBulkDeleteIds(idsPayload([null])), /positive 32-bit/);
  assert.throws(
    () => parseBulkDeleteIds(idsPayload(["2147483648"])),
    /positive 32-bit/
  );
  assert.throws(
    () => parseBulkDeleteIds(idsPayload(Array.from({ length: 501 }, (_, i) => i + 1))),
    /Cannot delete more than 500/
  );
});

test("removeMany validates ids and caps the batch before touching the database", async () => {
  await assert.rejects(
    () => ItemPriceService.removeMany([0]),
    /positive 32-bit/
  );
  await assert.rejects(
    () => ItemPriceService.removeMany(Array.from({ length: 501 }, (_, i) => i + 1)),
    /Cannot delete more than 500/
  );
});

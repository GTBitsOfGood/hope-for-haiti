import test from "node:test";
import assert from "node:assert/strict";
import { groupUsersByTagForSelect } from "../../src/lib/userUtils";
import { finalQuantityAfterPartnerEdit } from "../../src/util/requestQuantity";

test("partners with no tags land in an Untagged group instead of disappearing", () => {
  const groups = groupUsersByTagForSelect([
    { id: 3, name: "Clinic A", tags: [] },
    { id: 4, name: "Clinic B", tags: [{ id: 1, name: "North" }] },
    { id: 5, name: "Clinic C" },
  ] as unknown as Parameters<typeof groupUsersByTagForSelect>[0]);
  assert.deepEqual(
    groups.map((group) => [group.label, group.options.map((option) => option.label)]),
    [
      ["North", ["Clinic B"]],
      ["Untagged", ["Clinic A", "Clinic C"]],
    ]
  );
});

test("a partner's edit moves staff's revised number only while staff haven't revised it", () => {
  // Never revised: the revised number still equals the old request.
  assert.equal(finalQuantityAfterPartnerEdit({ quantity: 5, finalQuantity: 5 }, 7), 7);
  // Older rows with no revised number at all follow too.
  assert.equal(finalQuantityAfterPartnerEdit({ quantity: 5, finalQuantity: null }, 7), 7);
  // Staff revised it to 4: their number stays.
  assert.equal(finalQuantityAfterPartnerEdit({ quantity: 5, finalQuantity: 4 }, 7), undefined);
  // Only priority or comments changed: nothing to move.
  assert.equal(finalQuantityAfterPartnerEdit({ quantity: 5, finalQuantity: 5 }, 5), undefined);
  assert.equal(finalQuantityAfterPartnerEdit({ quantity: 5, finalQuantity: 5 }, undefined), undefined);
});

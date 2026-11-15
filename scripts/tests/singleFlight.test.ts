import test from "node:test";
import assert from "node:assert/strict";
import { createSingleFlight } from "../../src/util/singleFlight";

test("calls for the same key while one is running share it", async () => {
  const once = createSingleFlight<number, string>();
  let runs = 0;
  let finish: (value: string) => void = () => {};
  const run = () => {
    runs += 1;
    return new Promise<string>((resolve) => (finish = resolve));
  };

  const first = once(1, run);
  const second = once(1, run);
  finish("distribution 7");

  assert.deepEqual(await Promise.all([first, second]), ["distribution 7", "distribution 7"]);
  assert.equal(runs, 1);
});

test("different keys run separately, and a settled call runs fresh next time", async () => {
  const once = createSingleFlight<number, number>();
  let runs = 0;
  const run = async () => ++runs;

  assert.deepEqual(await Promise.all([once(1, run), once(2, run)]), [1, 2]);
  assert.equal(await once(1, run), 3);
});

test("a failed call is shared by its waiters and does not block a retry", async () => {
  const once = createSingleFlight<number, string>();
  const failing = () => Promise.reject(new Error("network down"));

  const results = await Promise.allSettled([once(1, failing), once(1, failing)]);
  assert.deepEqual(
    results.map((result) => result.status),
    ["rejected", "rejected"]
  );
  assert.equal(await once(1, async () => "ok"), "ok");
});

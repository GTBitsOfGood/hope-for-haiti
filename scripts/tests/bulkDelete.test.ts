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

test("bulk delete route deletes only requested rows and rejects bad requests", async () => {
  const { mock } = (await import("node:test")) as unknown as {
    mock: { module?: unknown } & Record<string, unknown>;
  };
  if (typeof mock.module !== "function") {
    // Older Node without mock.module: route-level coverage comes from the
    // real browser E2E instead (evidence/issue-393/results/e2e.json).
    assert.ok(true);
    return;
  }
  const mockModule = mock.module as unknown as (
    specifier: string,
    options: { namedExports: Record<string, unknown> }
  ) => void;

  let deletedIds: number[] = [];
  let authorized = false;

  mockModule("@/auth", {
    namedExports: {
      auth: async () => (authorized ? { user: { id: "1", type: "STAFF" } } : null),
    },
  });
  mockModule("@/db", {
    namedExports: {
      db: {
        itemPrice: {
          deleteMany: async ({ where }: { where: { id: { in: number[] } } }) => {
            deletedIds = where.id.in;
            return { count: where.id.in.length };
          },
        },
      },
    },
  });
  mockModule("@/services/userService", {
    namedExports: {
      default: {
        checkStaff: () => {},
        checkPermission: () => {},
      },
    },
  });

  const route = await import("../../src/app/api/itemPrices/bulkDelete/route");
  const POST = route.POST as unknown as (
    request: Request,
    context: unknown
  ) => Promise<Response>;

  const makeRequest = (body: unknown) =>
    new Request("http://localhost/api/itemPrices/bulkDelete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }) as unknown as Parameters<typeof POST>[0];

  authorized = true;
  const ok = (await POST(
    makeRequest({ ids: [3, 1, 3] }),
    {} as never
  )) as unknown as Response;
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { count: 2 });
  assert.deepEqual([...deletedIds].sort(), [1, 3]);

  authorized = false;
  const unauth = (await POST(
    makeRequest({ ids: [1] }),
    {} as never
  )) as unknown as Response;
  assert.equal(unauth.status, 401);

  authorized = true;
  const badJson = (await POST(
    makeRequest("not-json"),
    {} as never
  )) as unknown as Response;
  assert.equal(badJson.status, 400);

  const badIds = (await POST(
    makeRequest({ ids: [0] }),
    {} as never
  )) as unknown as Response;
  assert.equal(badIds.status, 400);
});

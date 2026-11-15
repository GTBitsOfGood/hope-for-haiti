import test, { mock } from "node:test";
import assert from "node:assert/strict";

// Safety net: if a fake below ever fails to apply, the real database client
// can only reach a dead address, so this test can never delete real rows.
process.env.DATABASE_URL = "postgresql://nobody:nothing@127.0.0.1:1/none";

type MockModule = (specifier: string, options: Record<string, unknown>) => void;
// mock.module only exists when node runs with --experimental-test-module-mocks.
// It must be bound to `mock`; calling it detached crashes.
const mockModule = (mock as unknown as { module?: MockModule }).module?.bind(mock);

// This file must not import any app code at the top: a module that is already
// loaded keeps its real imports, so the fakes would silently not apply.
test(
  "bulk delete route deletes only requested rows and rejects bad requests",
  { skip: !mockModule && "needs node --experimental-test-module-mocks" },
  async () => {
    if (!mockModule) return;

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
      defaultExport: { checkStaff: () => {}, checkPermission: () => {} },
    });

    const { POST } = (await import("../../src/app/api/itemPrices/bulkDelete/route")) as unknown as {
      POST: (request: Request) => Promise<Response>;
    };
    const post = (body: unknown) =>
      POST(
        new Request("http://localhost/api/itemPrices/bulkDelete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: typeof body === "string" ? body : JSON.stringify(body),
        })
      );

    authorized = true;
    const ok = await post({ ids: [3, 1, 3] });
    assert.equal(ok.status, 200);
    assert.deepEqual(await ok.json(), { count: 2 });
    assert.deepEqual([...deletedIds].sort((a, b) => a - b), [1, 3]);

    authorized = false;
    assert.equal((await post({ ids: [1] })).status, 401);

    authorized = true;
    assert.equal((await post("not-json")).status, 400);
    assert.equal((await post({ ids: [0] })).status, 400);
  }
);

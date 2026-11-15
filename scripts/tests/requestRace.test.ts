import test, { mock } from "node:test";
import assert from "node:assert/strict";

// Safety net: if a fake below ever fails to apply, the real database client
// can only reach a dead address.
process.env.DATABASE_URL = "postgresql://nobody:nothing@127.0.0.1:1/none";

type MockModule = (specifier: string, options: Record<string, unknown>) => void;
// mock.module only exists when node runs with --experimental-test-module-mocks.
const mockModule = (mock as unknown as { module?: MockModule }).module?.bind(mock);

type Row = { id: number; quantity: number; finalQuantity: number | null };

// No app code is imported at the top: a module that is already loaded keeps
// its real imports, so the fakes would silently not apply.
test(
  "a partner's edit never overwrites a staff revision saved in between",
  { skip: !mockModule && "needs node --experimental-test-module-mocks" },
  async () => {
    if (!mockModule) return;

    const row: Row = { id: 1, quantity: 5, finalQuantity: 5 };
    // When set, a staff save lands right after the partner's read.
    let staffRevisesTo: number | null = null;

    const requests = {
      findUnique: async () => {
        const snapshot = {
          ...row,
          generalItem: {
            donorOffer: {
              state: "UNFINALIZED",
              partnerResponseDeadline: new Date(Date.now() + 86_400_000),
            },
            items: [],
          },
        };
        if (staffRevisesTo !== null) row.finalQuantity = staffRevisesTo;
        return snapshot;
      },
      update: async ({ data }: { data: Partial<Row> }) => {
        Object.assign(row, data);
        return { ...row };
      },
      // Behaves like the database: the write only happens if the row still
      // matches the where clause at the moment of writing.
      updateMany: async ({ where, data }: { where: Partial<Row>; data: Partial<Row> }) => {
        if (where.id !== row.id || where.finalQuantity !== row.finalQuantity) {
          return { count: 0 };
        }
        Object.assign(row, data);
        return { count: 1 };
      },
    };

    mockModule("@/db", {
      namedExports: {
        db: {
          generalItemRequest: requests,
          $transaction: async (run: (tx: unknown) => unknown) =>
            run({ generalItemRequest: requests }),
        },
      },
    });
    mockModule("@/services/wishlistService", {
      namedExports: { WishlistService: {} },
    });

    const { GeneralItemRequestService } = (await import(
      "../../src/services/generalItemRequestService"
    )) as unknown as {
      GeneralItemRequestService: {
        updateRequest: (id: number, data: { quantity?: number }) => Promise<Row>;
      };
    };

    // Staff never revised it: the revised number follows the partner.
    await GeneralItemRequestService.updateRequest(1, { quantity: 7 });
    assert.deepEqual([row.quantity, row.finalQuantity], [7, 7]);

    // Staff revise to 4 between the partner's read and write: staff's 4 stays.
    staffRevisesTo = 4;
    const saved = await GeneralItemRequestService.updateRequest(1, { quantity: 9 });
    assert.deepEqual([row.quantity, row.finalQuantity], [9, 4]);
    assert.equal(saved.finalQuantity, 4);
  }
);

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
  "overlapping saves never leave a revised number staff didn't choose",
  { skip: !mockModule && "needs node --experimental-test-module-mocks" },
  async () => {
    if (!mockModule) return;

    const row: Row = { id: 1, quantity: 5, finalQuantity: 5 };
    // What the save's first (unlocked) read sees, when it should be out of date.
    let staleRead: Row | null = null;
    // When set, a staff save lands right after that first read.
    let staffRevisesTo: number | null = null;
    let locks = 0;

    const requests = {
      // The first read, used for the state and deadline checks.
      findUnique: async () => {
        const seen = staleRead ?? { ...row };
        if (staffRevisesTo !== null) row.finalQuantity = staffRevisesTo;
        return {
          ...seen,
          generalItem: {
            donorOffer: {
              state: "UNFINALIZED",
              partnerResponseDeadline: new Date(Date.now() + 86_400_000),
            },
            items: [],
          },
        };
      },
      // The read inside the transaction, after the row lock: always current.
      findUniqueOrThrow: async () => ({ quantity: row.quantity, finalQuantity: row.finalQuantity }),
      update: async ({ data }: { data: Partial<Row> }) => {
        Object.assign(row, data);
        return { ...row };
      },
    };

    mockModule("@/db", {
      namedExports: {
        db: {
          generalItemRequest: requests,
          $transaction: async (run: (tx: unknown) => unknown) =>
            run({
              generalItemRequest: requests,
              $queryRaw: async () => {
                locks += 1;
                return [];
              },
            }),
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
    assert.equal(locks, 1, "the row is locked before deciding");

    // Staff revise to 4 right after the partner's first read: staff's 4 stays.
    staffRevisesTo = 4;
    const saved = await GeneralItemRequestService.updateRequest(1, { quantity: 9 });
    staffRevisesTo = null;
    assert.deepEqual([row.quantity, row.finalQuantity], [9, 4]);
    assert.equal(saved.finalQuantity, 4);

    // Two partner saves overlap: both first read 5 / 5, the first saves 7.
    // The second still sees the current 7 / 7 inside the lock and follows to 9.
    Object.assign(row, { quantity: 5, finalQuantity: 5 });
    await GeneralItemRequestService.updateRequest(1, { quantity: 7 });
    staleRead = { id: 1, quantity: 5, finalQuantity: 5 };
    await GeneralItemRequestService.updateRequest(1, { quantity: 9 });
    staleRead = null;
    assert.deepEqual([row.quantity, row.finalQuantity], [9, 9]);
  }
);

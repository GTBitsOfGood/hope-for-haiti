import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
// import { authMock } from "@/test/authMock";
import { validateSession, invalidateSession } from "@/test/util/authMockUtils";
import { manyUnclaimedItems } from "@/test/util/dbMockUtils";
import { dbMock } from "@/test/dbMock";
import { UnclaimedItem } from "@prisma/client";

test("Should return 401 for invalid session", async () => {
    await testApiHandler({
        appHandler,
        async test({ fetch }) {
            invalidateSession();

            const res = await fetch({ method: "GET" });
            await expect(res.status).toBe(401);
            const json = await res.json();
            await expect(json).toEqual({ message: "Session required" });
        }
    })
});

test("Should return 200 for valid session", async () => {
    await testApiHandler({
        appHandler,
        async test({ fetch }) {
            validateSession();

            const res = await fetch({ method: "GET" });
            await expect(res.status).toBe(200);
        }
    })
});

test("Should give correct database queries", async () => {
    await testApiHandler({
        appHandler,
        async test({ fetch }) {
            // Create mock data
            dbMock.unclaimedItem.create({ data: { id: 1, name: "Test Item 1", quantity: 1, expirationDate: new Date() } });
            const items: UnclaimedItem[] = await manyUnclaimedItems(3);
            // Convert items expirationDate to ISO-8601 string
            const expectedRet = items.map(item => {
                return { ...item, expirationDate: item.expirationDate?.toISOString() || "" }
            });

            validateSession();

            const res = await fetch({ method: "GET" });
            await expect(res.status).toBe(200);

            // Check that the database was queried
            await expect(dbMock.unclaimedItem.findMany).toHaveBeenCalledTimes(1);

            // Check that the response json was written correctly
            const json = await res.json();
            await expect(json["unclaimedItems"]).toEqual(expectedRet);
        }
    })
});
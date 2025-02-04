import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
// import { authMock } from "@/test/authMock";
import { validateSession, invalidateSession } from "@/test/util/authMockUtils";
import { fillDbMockWithManyUnclaimedItems } from "@/test/util/dbMockUtils";
import { dbMock } from "@/test/dbMock";

test("Should return 401 for invalid session", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      invalidateSession();

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(401);
      const json = await res.json();
      await expect(json).toEqual({ message: "Session required" });
    },
  });
});

test("Should return 200 for valid session", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);
    },
  });
});

test("Should give correct database queries", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      await fillDbMockWithManyUnclaimedItems(3);
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);

      // Check that the response json was written correctly
      const expectedRet = {
        unclaimedItems: await dbMock.unclaimedItem.findMany(),
      };
      const json = await res.json();
      await expect(json).toEqual(JSON.parse(JSON.stringify(expectedRet))); // Needed to stringify and parse because the expiration field would cause an error because Date != ISOstring
    },
  });
});

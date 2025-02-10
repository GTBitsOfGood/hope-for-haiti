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

// !!! INCOMPLETE !!!
test("Should return 400 on invalid expirationDateAfter", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher(request) {
      request.nextUrl.searchParams.set("expirationDateAfter", "foo");
      request.nextUrl.searchParams.set(
        "expirationDateBefore",
        "2025-02-10T20:21:11+00:00"
      );
    },
    async test({ fetch }) {
      await fillDbMockWithManyUnclaimedItems(3);
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(400);

      // Check that the response json was written correctly
      const expectedRet = {
        unclaimedItems: await dbMock.unclaimedItem.findMany(),
      };
      const json = await res.json();
      await expect(json).toEqual(JSON.parse(JSON.stringify(expectedRet))); // Needed to stringify and parse because the expiration field would cause an error because Date != ISOstring
    },
  });
});

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
// import { authMock } from "@/test/authMock";
import { validateSession, invalidateSession } from "@/test/util/authMockUtils";
import { fillDbMockWithManyItems } from "@/test/util/dbMockUtils";
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
      await fillDbMockWithManyItems(3);
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);

      // Check that the response json was written correctly
      const expectedRet = {
        items: await dbMock.item.findMany(),
      };
      const json = await res.json();
      await expect(json).toEqual(JSON.parse(JSON.stringify(expectedRet))); // Needed to stringify and parse because the expiration field would cause an error because Date != ISOstring
    },
  });
});

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
      await fillDbMockWithManyItems(3);
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(400);
      await expect(res.json()).resolves.toStrictEqual({
        message: "expirationDateAfter must be a valid ISO-8601 timestamp",
      });
    },
  });
});

test("Should return 400 on invalid expirationDateBefore", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher(request) {
      request.nextUrl.searchParams.set(
        "expirationDateAfter",
        "2025-02-10T20:21:11+00:00"
      );
      request.nextUrl.searchParams.set("expirationDateBefore", "foo");
    },
    async test({ fetch }) {
      await fillDbMockWithManyItems(3);
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(400);
      await expect(res.json()).resolves.toStrictEqual({
        message: "expirationDateBefore must be a valid ISO-8601 timestamp",
      });
    },
  });
});

test("Should be successful when both expirationDateBefore, expirationDateAfter valid", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher(request) {
      request.nextUrl.searchParams.set(
        "expirationDateAfter",
        "2025-02-10T00:00:00.000Z"
      );
      request.nextUrl.searchParams.set(
        "expirationDateBefore",
        "2025-02-14T00:00:00.000Z"
      );
    },
    async test({ fetch }) {
      await fillDbMockWithManyItems(3, [
        new Date("2025-02-11"),
        new Date("2025-02-12"),
        new Date("2025-02-13"),
      ]);
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);

      const expectedRet = {
        items: await dbMock.item.findMany(),
      };
      const json = await res.json();
      await expect(json).toEqual(JSON.parse(JSON.stringify(expectedRet)));
    },
  });
});

test("Should be successful when expirationDateBefore valid, expirationDateAfter missing", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher(request) {
      request.nextUrl.searchParams.set(
        "expirationDateBefore",
        "2025-02-14T00:00:00.000Z"
      );
    },
    async test({ fetch }) {
      await fillDbMockWithManyItems(3, [
        new Date("2025-02-11"),
        new Date("2025-02-12"),
        new Date("2025-02-13"),
      ]);
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);

      const expectedRet = {
        items: await dbMock.item.findMany(),
      };
      const json = await res.json();
      await expect(json).toEqual(JSON.parse(JSON.stringify(expectedRet)));
    },
  });
});

test("Should be successful when expirationDateBefore missing, expirationDateAfter valid", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher(request) {
      request.nextUrl.searchParams.set(
        "expirationDateAfter",
        "2025-02-10T00:00:00.000Z"
      );
    },
    async test({ fetch }) {
      await fillDbMockWithManyItems(3, [
        new Date("2025-02-11"),
        new Date("2025-02-12"),
        new Date("2025-02-13"),
      ]);
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);

      const expectedRet = {
        items: await dbMock.item.findMany(),
      };
      const json = await res.json();
      await expect(json).toEqual(JSON.parse(JSON.stringify(expectedRet)));
    },
  });
});

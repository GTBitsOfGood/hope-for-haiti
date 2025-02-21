import { dbMock } from "@/test/dbMock";

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
import { validateSession, invalidateSession } from "@/test/util/authMockUtils";

test("Should return 401 for invalid session", async () => {
  await testApiHandler({
    params: { partnerId: "1" },
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

test("Should return 403 if not STAFF, ADMIN, or SUPER_ADMIN", async () => {
  await testApiHandler({
    params: { partnerId: "1" },
    appHandler,
    async test({ fetch }) {
      validateSession("PARTNER");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(403);
      const json = await res.json();
      await expect(json).toEqual({ message: "Unauthorized" });
    },
  });
});

test("Should return 200 if STAFF", async () => {
  await testApiHandler({
    params: { partnerId: "1" },
    appHandler,
    async test({ fetch }) {
      validateSession("STAFF");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);
    },
  });
});

test("Should return 200 if ADMIN", async () => {
  await testApiHandler({
    params: { partnerId: "1" },
    appHandler,
    async test({ fetch }) {
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);
    },
  });
});

test("Should return 200 if SUPER_ADMIN", async () => {
  await testApiHandler({
    params: { partnerId: "1" },
    appHandler,
    async test({ fetch }) {
      validateSession("SUPER_ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);
    },
  });
});

// This method doesn't have a mock db implemented such that it verifies that the only items being pulled are those associated with the partner id.
test("Should return 200 and unallocated item requests associated with partnerId", async () => {
  await testApiHandler({
    params: { partnerId: "1" },
    appHandler,
    async test({ fetch }) {
      validateSession("STAFF");

      const expectedResponse = await dbMock.unallocatedItemRequest.findMany();

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toEqual({ unallocatedItemRequests: expectedResponse });
    },
  });
});

import { dbMock } from "@/test/dbMock";

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
import { validateSession, invalidateSession } from "@/test/util/authMockUtils";

test("Should return 401 for no session", async () => {
  await testApiHandler({
    params: { unallocatedItemId: "1" },
    appHandler,
    async test({ fetch }) {
      invalidateSession();

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toEqual({ message: "Session required" });
    },
  });
});

test("Should return 403 for being PARTNER", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("PARTNER");

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json).toEqual({ message: "Unauthorized" });
    },
  });
});

test("Should return 200 for being STAFF", async () => {
  await testApiHandler({
    params: { unallocatedItemId: "1" },
    appHandler,
    async test({ fetch }) {
      validateSession("STAFF");

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(200);
    },
  });
});

test("Should return 200 for being ADMIN", async () => {
  await testApiHandler({
    params: { unallocatedItemId: "1" },
    appHandler,
    async test({ fetch }) {
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(200);
    },
  });
});

test("Should return 200 for being SUPER_ADMIN", async () => {
  await testApiHandler({
    params: { unallocatedItemId: "1" },
    appHandler,
    async test({ fetch }) {
      validateSession("SUPER_ADMIN");

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(200);
    },
  });
});

test("For an authorized session, should give all unallocated item requests pointed to the specificed item", async () => {
  await testApiHandler({
    params: { unallocatedItemId: "1" },
    appHandler,
    async test({ fetch }) {
      const unallocatedItemRequests =
        await dbMock.unallocatedItemRequest.findMany();

      validateSession("STAFF");
      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ unallocatedItemRequests });
      // expect(json).toEqual({
      //   unallocatedItemRequests: unallocatedItemRequests.forEach((uir) => {
      //     return {
      //       id: uir.id,
      //       quantity: uir.quantity,
      //       comments: uir.comments,
      //     };
      //   }),
      // });
    },
  });
});

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
import { invalidateSession, validateSession } from "@/test/util/authMockUtils";

test("Should return 401 for no session", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      invalidateSession();

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(401);
    },
  });
});

test("Should return 400 for missing/invalid filename", async () => {
  await testApiHandler({
    appHandler,
    url: "/api/file/upload",
    async test({ fetch }) {
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(400);
    },
  });
  await testApiHandler({
    appHandler,
    url: "/api/file/upload?filename=",
    async test({ fetch }) {
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(400);
    },
  });
});

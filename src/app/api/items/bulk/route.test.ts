import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
import { validateSession, invalidateSession } from "@/test/util/authMockUtils";

test("Should return 401 for no session", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      invalidateSession();

      const res = await fetch({ method: "POST" });
      expect(res.status).toBe(401);
    },
  });
});

test("Should return 403 if sessions is PARTNER or STAFF", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("PARTNER");

      const res = await fetch({ method: "POST" });
      expect(res.status).toBe(403);
    },
  });

  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("STAFF");

      const res = await fetch({ method: "POST" });
      expect(res.status).toBe(403);
    },
  });
});

test("Should return 200 if session is ADMIN or SUPER_ADMIN", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("ADMIN");

      const res = await fetch({ method: "POST" });
      expect(res.status).toBe(200);
    },
  });

  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("SUPER_ADMIN");

      const res = await fetch({ method: "POST" });
      expect(res.status).toBe(200);
    },
  });
});

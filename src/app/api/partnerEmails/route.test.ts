import "@/test/realDb";

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
import { validateSession } from "@/test/util/authMockUtils";
import { UserType } from "@prisma/client";
import { db } from "@/db";
import { hash } from "argon2";

test.skip("returns 200 on authorized use by super admin", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession(UserType.SUPER_ADMIN);

      await db.user.create({
        data: {
          email: "test@test.com",
          name: "test partner",
          passwordHash: await hash("asdas"),
          type: "PARTNER",
        },
      });

      const res = await fetch({ method: "GET", body: null });
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toStrictEqual({
        partnerEmails: ["test@test.com"],
      });
    },
  });
});

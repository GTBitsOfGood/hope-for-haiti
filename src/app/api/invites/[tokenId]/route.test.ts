import { testApiHandler } from "next-test-api-route-handler";
import { expect, test } from "@jest/globals";

import { dbMock } from "@/test/dbMock";

import * as appHandler from "./route";
import { UserType } from "@prisma/client";

test("invite does not exist", async () => {
  await testApiHandler({
    appHandler,
    params: { token: "1234" },
    async test({ fetch }) {
      dbMock.userInvite.findUnique.mockResolvedValue(null);

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(400);
    },
  });
});

test("invite is expired", async () => {
  await testApiHandler({
    appHandler,
    params: { token: "1234" },
    async test({ fetch }) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      dbMock.userInvite.findUnique.mockResolvedValue({
        id: 1,
        email: "email@test.com",
        expiration: pastDate,
        name: "test name",
        partnerDetails: null,
        token: "1234",
        userType: UserType.ADMIN,
      });

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(400);
    },
  });
});

test("invite is valid", async () => {
  await testApiHandler({
    appHandler,
    params: { token: "1234" },
    async test({ fetch }) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      dbMock.userInvite.findUnique.mockResolvedValue({
        id: 1,
        email: "email@test.com",
        expiration: futureDate,
        name: "test name",
        partnerDetails: null,
        token: "1234",
        userType: UserType.ADMIN,
      });

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toStrictEqual({
        email: "email@test.com",
        name: "test name",
      });
    },
  });
});

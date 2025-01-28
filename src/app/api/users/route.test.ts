import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";

import { expect, test } from "@jest/globals";
import { dbMock } from "@/test/dbMock";
import { User, UserType } from "@prisma/client";

test("bad form data", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      const badFormData = new FormData();
      badFormData.append('inviteTokenBad', 'test_token');
      badFormData.append('passwordBad', 'test_password');

      const res = await fetch({ method: "POST", body: badFormData });
      await expect(res.status).toEqual(400);
    },
  });
});

const goodFormData = new FormData();
goodFormData.append('inviteToken', 'test_token');
goodFormData.append('password', 'test_password');

const mockUser: User = {
    type: UserType.SUPER_ADMIN,
    id: 0,
    email: "test_email@test.com",
    passwordHash: "hashed_test_password"
};

test("missing user invite", async () => {
    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        dbMock.userInvite.findUnique.mockResolvedValue(null);

        const res = await fetch({ method: "POST", body: goodFormData });
        await expect(res.status).toEqual(404);
      },
    });
  });

test("expired user invite", async () => {
    await testApiHandler({
        appHandler,
        async test({ fetch }) {
            const yearAgo = new Date();
            yearAgo.setFullYear(new Date().getFullYear() - 1);

            dbMock.userInvite.findUnique.mockResolvedValue({
                token: 'test_token',
                id: 0,
                userType: UserType.SUPER_ADMIN,
                email: "test_email@test.com",
                expiration: yearAgo
            });

            const res = await fetch({ method: "POST", body: goodFormData });
            await expect(res.status).toEqual(400);
        },
    });
});

test("user already exists", async () => {
    await testApiHandler({
        appHandler,
        async test({ fetch }) {
            const yearLater = new Date();
            yearLater.setFullYear(new Date().getFullYear() + 1);

            dbMock.userInvite.findUnique.mockResolvedValue({
                token: 'test_token',
                id: 0,
                userType: UserType.SUPER_ADMIN,
                email: "test_email@test.com",
                expiration: yearLater
            });

            dbMock.user.findUnique.mockResolvedValue(mockUser);

            const res = await fetch({ method: "POST", body: goodFormData });
            await expect(res.status).toEqual(409);
        },
    });
});

test("successful create", async () => {
    await testApiHandler({
        appHandler,
        async test({ fetch }) {
            const yearLater = new Date();
            yearLater.setFullYear(new Date().getFullYear() + 1);

            dbMock.userInvite.findUnique.mockResolvedValue({
                token: 'test_token',
                id: 0,
                userType: UserType.SUPER_ADMIN,
                email: "test_email@test.com",
                expiration: yearLater
            });

            dbMock.user.findUnique.mockResolvedValue(null);
            dbMock.user.create.mockResolvedValue(mockUser);

            const res = await fetch({ method: "POST", body: goodFormData });
            await expect(res.status).toEqual(200);
            await expect(res.json()).resolves.toStrictEqual(mockUser);
        },
    });
});
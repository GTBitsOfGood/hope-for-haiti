import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";

import { expect, test } from "@jest/globals";
import { dbMock } from "@/test/dbMock";
import { authMock } from "@/test/authMock";
import { User, UserType } from "@prisma/client";

test("returns 401 on unauthenticated requests", async () => {
    await testApiHandler({
        appHandler,
        async test({ fetch }) {
            // Mock invalid session
            authMock.mockReturnValueOnce(null);

            const res = await fetch({ method: "GET", body: null });
            await expect(res.status).toBe(401);
            await expect(res.json()).resolves.toStrictEqual({
                message: "Session required",
            });
        },
    });
});

test("returns 403 on unauthorized requests", async () => {
    await testApiHandler({
        appHandler,
        async test({ fetch }) {
            // Mock unauthorized session
            authMock.mockReturnValueOnce({
                user: { id: "1234", type: UserType.PARTNER },
                expires: "",
            });

            const res = await fetch({ method: "GET", body: null });
            await expect(res.status).toBe(403);
            await expect(res.json()).resolves.toStrictEqual({
                message: "Must be STAFF, ADMIN, or SUPER_ADMIN",
            });
        },
    });
});

test("returns 200 and user list on succesful request", async () => {
    await testApiHandler({
        appHandler,
        async test({ fetch }) {
            authMock.mockReturnValueOnce({
                user: { id: "1234", type: UserType.SUPER_ADMIN },
                expires: "",
            });

            const exampleData = [
                {
                    email: "admin@test.com",
                    type: UserType.ADMIN,
                },
                {
                    email: "superadmin@test.com",
                    type: UserType.SUPER_ADMIN,
                },
            ];

            dbMock.user.findMany
                // @ts-expect-error We're only selecting the email and type column
                .mockResolvedValue(exampleData);

            const res = await fetch({ method: "GET", body: null });
            await expect(res.status).toBe(200);
            await expect(res.json()).resolves.toStrictEqual([
                { email: "admin@test.com", type: "ADMIN" },
                { email: "superadmin@test.com", type: "SUPER_ADMIN" },
            ]);
        },
    });
});

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

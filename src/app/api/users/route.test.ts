import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from "./route";

import { expect, test } from "@jest/globals";
import { dbMock } from "@/test/dbMock";
import { authMock } from "@/test/authMock";
import { UserType } from '@prisma/client';


test("returns 401 on unauthenticated requests", async () => {
    await testApiHandler({
        appHandler,
        async test({ fetch }) {
            // Mock invalid session
            authMock.mockReturnValueOnce(null);

            const res = await fetch({ method: "GET", body: null });
            await expect(res.status).toBe(401);
            await expect(res.json()).resolves.toStrictEqual({ message: "Session required" });
        }
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
            await expect(res.json()).resolves.toStrictEqual({ message: "Must be STAFF, ADMIN, or SUPER_ADMIN" });
        }
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
                }
            ]

            dbMock.user.findMany
            // @ts-expect-error We're only selecting the email and type column
            .mockResolvedValue(exampleData);

            const res = await fetch({ method: "GET", body: null });
            await expect(res.status).toBe(200);
            await expect(res.json()).resolves.toStrictEqual([{ email: "admin@test.com", type: "ADMIN" }, { email: "superadmin@test.com", type: "SUPER_ADMIN" }]);
        }
    });
});
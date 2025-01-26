import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";

import { expect, test } from "@jest/globals";
import { dbMock } from "@/test/dbMock";
import { authMock } from "@/test/authMock";
import { OrganizationType, UserType } from "@prisma/client";

test("returns 401 on invalid session", async () => {
    await testApiHandler({
        appHandler,
        paramsPatcher: (params) => ({ ...params, userId: "1234" }),
        async test({ fetch }) {
            // Mock invalid session
            authMock.mockReturnValueOnce(null);

            const res = await fetch({ method: "GET", body: null });
            await expect(res.status).toBe(401);
            await expect(res.json()).resolves.toStrictEqual({ message: "Session required" });
        },
    });
});

test("returns 403 on unauthorized", async () => {
    await testApiHandler({
        appHandler,
        paramsPatcher: (params) => ({ ...params, userId: "1234" }),
        async test({ fetch }) {
            // User id different from session user id
            authMock.mockReturnValueOnce({
                user: { id: "4321", type: UserType.PARTNER },
                expires: "",
            });

            const res = await fetch({ method: "GET", body: null });
            await expect(res.status).toBe(403);
            await expect(res.json()).resolves.toStrictEqual({ message: "You are not allowed to view this" });
        },
    });
});

test("returns 404 on not found", async () => {
    await testApiHandler({
        appHandler,
        paramsPatcher: (params) => ({ ...params, userId: "1234" }),
        async test({ fetch }) {
            authMock.mockReturnValueOnce({
                user: { id: "1234", type: UserType.PARTNER },
                expires: "",
            });

            // Mock record not found
            dbMock.partnerDetails.findUnique.mockResolvedValueOnce(null);

            const res = await fetch({ method: "GET", body: null });
            await expect(res.status).toBe(404);
            await expect(res.json()).resolves.toStrictEqual({ message: "Partner details not found" });
        },
    });
});

test("returns 200 and correct details on success", async () => {
    await testApiHandler({
        appHandler,
        paramsPatcher: (params) => ({ ...params, userId: "1234" }),
        async test({ fetch }) {
            // Mock invalid session
            authMock.mockReturnValueOnce({
                user: { id: "1234", type: UserType.PARTNER },
                expires: "",
            });

            const exampleDetails = {
                id: 1,
                userId: 1234,
                numberOfPatients: 10,
                organizationType: OrganizationType.NON_PROFIT,
            }

            // Mock return for user count
            dbMock.partnerDetails.findUnique.mockResolvedValueOnce(exampleDetails);

            const res = await fetch({ method: "GET", body: null });
            await expect(res.status).toBe(200);
            await expect(res.json()).resolves.toStrictEqual({ numberOfPatients: 10, organizationType: OrganizationType.NON_PROFIT });
        },
    });
});

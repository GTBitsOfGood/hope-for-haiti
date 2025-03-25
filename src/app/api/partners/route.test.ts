/* eslint-disable @typescript-eslint/no-explicit-any */
//Lint gets angry when "as any" is used, but it is necessary for mocking Prisma responses using the "select" parameter (for now).
import { dbMock } from "@/test/dbMock";

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
import { invalidateSession, validateSession } from "@/test/util/authMockUtils";
import { UserType } from "@prisma/client";

test("returns 401 on invalid session", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      // Mock invalid session
      await invalidateSession();
      const res = await fetch({ method: "GET", body: null });
      await expect(res.status).toBe(401);
      await expect(res.json()).resolves.toStrictEqual({
        message: "Session required",
      });
    },
  });
});

test("returns 403 on unauthorized", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession(UserType.PARTNER);
      const res = await fetch({ method: "GET", body: null });
      await expect(res.status).toBe(403);
      await expect(res.json()).resolves.toStrictEqual({
        message: "You are not allowed to view this",
      });
    },
  });
});

test("returns 200 on authorized use by admin", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession(UserType.ADMIN);
      const testData = [
        {
          name: "Partner A",
          email: "partner@partner.com",
          _count: {
            unallocatedItemRequests: 1,
          },
        },
        {
          name: "Partner B",
          email: "partner1@partner.com",
          _count: {
            unallocatedItemRequests: 2,
          },
        },
      ];
      const expectedResponse = {
        partners: [
          {
            name: "Partner A",
            email: "partner@partner.com",
            unallocatedItemRequestCount: 1,
          },
          {
            name: "Partner B",
            email: "partner1@partner.com",
            unallocatedItemRequestCount: 2,
          },
        ],
      };
      dbMock.user.findMany.mockResolvedValue(testData as any);
      const res = await fetch({ method: "GET", body: null });
      await expect(res.status).toBe(200);
      await expect(res.json()).resolves.toStrictEqual(expectedResponse);
    },
  });
});

test("returns 200 on authorized use by super admin", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession(UserType.SUPER_ADMIN);
      const testData = [
        {
          name: "Partner A",
          email: "partner@partner.com",
          _count: {
            unallocatedItemRequests: 1,
          },
        },
        {
          name: "Partner B",
          email: "partner1@partner.com",
          _count: {
            unallocatedItemRequests: 2,
          },
        },
      ];
      const expectedResponse = {
        partners: [
          {
            name: "Partner A",
            email: "partner@partner.com",
            unallocatedItemRequestCount: 1,
          },
          {
            name: "Partner B",
            email: "partner1@partner.com",
            unallocatedItemRequestCount: 2,
          },
        ],
      };
      dbMock.user.findMany.mockResolvedValue(testData as any);
      const res = await fetch({ method: "GET", body: null });
      await expect(res.status).toBe(200);
      await expect(res.json()).resolves.toStrictEqual(expectedResponse);
    },
  });
});

test("returns 200 on authorized use by staff", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession(UserType.STAFF);
      const testData = [
        {
          name: "Partner A",
          email: "partner@partner.com",
          _count: {
            unallocatedItemRequests: 1,
          },
        },
        {
          name: "Partner B",
          email: "partner1@partner.com",
          _count: {
            unallocatedItemRequests: 2,
          },
        },
      ];
      const expectedResponse = {
        partners: [
          {
            name: "Partner A",
            email: "partner@partner.com",
            unallocatedItemRequestCount: 1,
          },
          {
            name: "Partner B",
            email: "partner1@partner.com",
            unallocatedItemRequestCount: 2,
          },
        ],
      };
      dbMock.user.findMany.mockResolvedValue(testData as any);
      const res = await fetch({ method: "GET", body: null });
      await expect(res.status).toBe(200);
      await expect(res.json()).resolves.toStrictEqual(expectedResponse);
    },
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
//Lint gets angry when "as any" is used, but it is necessary for mocking Prisma responses using the "select" parameter (for now).
import { dbMock } from "@/test/dbMock";

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";

import { expect, test } from "@jest/globals";
import { invalidateSession, validateSession } from "@/test/util/authMockUtils";
import { ItemCategory, Prisma, UserType } from "@prisma/client";

const item = {
  title: "Some item",
  type: "doo dad",
  category: ItemCategory.MEDICAL_SUPPLY,
  quantity: 2,
  expirationDate: new Date(1000),
  unitSize: 64,
  unitType: "bunches",
  datePosted: new Date(1000),
  lotNumber: 2,
  palletNumber: 3,
  boxNumber: 4,
  donorName: "John Doe",
  unitPrice: new Prisma.Decimal(1234),
  maxRequestLimit: "5",
};
const invalidItem = {
  title: "foobar",
  category: "baz",
  quantity: -1,
  donorName: 17.5,
};
const itemOutput = {
  title: "Some item",
  type: "doo dad",
  category: ItemCategory.MEDICAL_SUPPLY,
  quantity: 2,
  expirationDate: new Date(1000).toISOString(),
  unitSize: 64,
  datePosted: new Date(1000).toISOString(),
  lotNumber: 2,
  donorName: "John Doe",
  unitPrice: 7,
  unitType: "bunches",
  maxRequestLimit: "5",
};

test("returns 401 on invalid session", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      // Mock invalid session
      invalidateSession();
      const itemFormData = new FormData();
      Object.entries(item).forEach(([key, value]) =>
        itemFormData.append(key, value.toString())
      );
      const res = await fetch({ method: "POST", body: itemFormData });
      await expect(res.status).toBe(401);
      await expect(res.json()).resolves.toStrictEqual({
        message: "Session required",
      });
    },
  });
});

test("returns 403 on unauthorized (partner)", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession(UserType.PARTNER);
      const itemFormData = new FormData();
      Object.entries(item).forEach(([key, value]) =>
        itemFormData.append(key, value.toString())
      );
      const res = await fetch({ method: "POST", body: itemFormData });
      await expect(res.status).toBe(403);
      await expect(res.json()).resolves.toStrictEqual({
        message: "You are not allowed to add this record",
      });
    },
  });
});

test("returns 403 on unauthorized (staff)", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession(UserType.STAFF);
      const itemFormData = new FormData();
      Object.entries(item).forEach(([key, value]) =>
        itemFormData.append(key, value.toString())
      );
      const res = await fetch({ method: "POST", body: itemFormData });
      await expect(res.status).toBe(403);
      await expect(res.json()).resolves.toStrictEqual({
        message: "You are not allowed to add this record",
      });
    },
  });
});

test("returns 400 on bad form data", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession(UserType.ADMIN);
      const itemFormData = new FormData();
      Object.entries(invalidItem).forEach(([key, value]) =>
        itemFormData.append(key, value.toString())
      );
      const res = await fetch({ method: "POST", body: itemFormData });
      await expect(res.status).toBe(400);
      await expect(res.json()).resolves.toStrictEqual({
        message: "Invalid form data",
      });
    },
  });
});

test("returns 200 and correctly creates item (admin)", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession(UserType.ADMIN);
      const itemFormData = new FormData();
      Object.entries(item).forEach(([key, value]) =>
        itemFormData.append(key, value.toString())
      );
      dbMock.item.create.mockResolvedValueOnce(itemOutput as any);
      const res = await fetch({ method: "POST", body: itemFormData });
      await expect(res.status).toBe(200);
      await expect(res.json()).resolves.toStrictEqual(itemOutput);
    },
  });
});

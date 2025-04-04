import "@/test/realDb";

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
// import { authMock } from "@/test/authMock";
import { validateSession, invalidateSession } from "@/test/util/authMockUtils";
import { db } from "@/db";
import { Item, ItemCategory, Prisma } from "@prisma/client";

const seedMockItems = async () => {
  const createMockItem = (
    title: string,
    type: string,
    unitSize: number,
    expirationDate: Date | null,
  ): Item => {
    const generatedIds = new Set<number>();

    let id: number;
    do {
      id = Math.floor(Math.random() * 1000000); // Generate a random integer ID
    } while (generatedIds.has(id)); // Ensure the ID is unique

    generatedIds.add(id);

    return {
      id: id,
      title,
      category: ItemCategory.MEDICATION,
      quantity: 100,
      expirationDate,
      unitSize,
      unitType: `Unit Type ${Math.floor(Math.random() * 3)}`,
      datePosted: new Date(Date.now() + Math.floor(Math.random() * 10000)),
      lotNumber: Math.floor(Math.random() * 100),
      palletNumber: Math.floor(Math.random() * 100),
      boxNumber: Math.floor(Math.random() * 100),
      donorName: "test donor",
      unitPrice: new Prisma.Decimal(
        Math.round(Math.random() * 100 * 100) / 100,
      ),
      maxRequestLimit: "abc",
      type,
      allowAllocations: false,
      visible: true,
      gik: true,
      donorShippingNumber: "test donorShippingNumber",
      hfhShippingNumber: "test hfhShippingNumber",
      quantityPerUnit: "test quantityPerUnit",
      ndc: "test quantityPerUnit",
      notes: "test notes",
    };
  };

  const date1 = new Date("2025-02-11");

  const items = [
    createMockItem("test_title", "test_type", 5, date1),
    createMockItem("test_title", "test_type", 5, date1),
    createMockItem("test_title2", "test_type", 6, date1),
    createMockItem("test_title2", "test_type2", 6, null),
  ];
  await db.item.deleteMany({});
  await db.item.createMany({
    data: items,
  });
  return items;
};

test("Should return 401 for invalid session", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      invalidateSession();

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(401);
      const json = await res.json();
      await expect(json).toEqual({ message: "Session required" });
    },
  });
});

test("Should return 403 if not STAFF, ADMIN, or SUPER_ADMIN", async () => {
  await testApiHandler({
    params: { partnerId: "1" },
    appHandler,
    async test({ fetch }) {
      validateSession("PARTNER");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(403);
      const json = await res.json();
      await expect(json).toEqual({ message: "Unauthorized" });
    },
  });
});

test("Should give correct database queries", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher(request) {
      request.nextUrl.searchParams.set("title", "test_title");
      request.nextUrl.searchParams.set(
        "expiration",
        new Date("2025-02-11").toISOString(),
      );
      request.nextUrl.searchParams.set("type", "test_type");
      request.nextUrl.searchParams.set("unitSize", "5");
    },
    async test({ fetch }) {
      const items = await seedMockItems();
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);

      // Check that the response json was written correctly
      const expectedRet = [items[0], items[1]];
      const json = await res.json();
      await expect(json.items).toEqual(
        expect.arrayContaining(JSON.parse(JSON.stringify(expectedRet))),
      ); // Needed to stringify and parse because the expiration field would cause an error because Date != ISOstring
    },
  });
});

test("Should give correct database queries with undefined expiration", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher(request) {
      request.nextUrl.searchParams.set("title", "test_title2");
      request.nextUrl.searchParams.set("type", "test_type2");
      request.nextUrl.searchParams.set("unitSize", "6");
    },
    async test({ fetch }) {
      const items = await seedMockItems();
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);

      // Check that the response json was written correctly
      const expectedRet = [items[3]];
      const json = await res.json();
      await expect(json.items).toEqual(
        expect.arrayContaining(JSON.parse(JSON.stringify(expectedRet))),
      ); // Needed to stringify and parse because the expiration field would cause an error because Date != ISOstring
    },
  });
});

test("Should return 400 on invalid expiration", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher(request) {
      request.nextUrl.searchParams.set("title", "test_title");
      request.nextUrl.searchParams.set("expiration", "bad expiration date");
      request.nextUrl.searchParams.set("type", "test_type");
      request.nextUrl.searchParams.set("unitSize", "5");
    },
    async test({ fetch }) {
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(400);
      await expect(res.json()).resolves.toStrictEqual({
        message: "Expiration must be a valid ISO-8601 timestamp",
      });
    },
  });
});

test("Should return 400 on invalid unit size", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher(request) {
      request.nextUrl.searchParams.set("title", "test_title");
      request.nextUrl.searchParams.set(
        "expiration",
        new Date("2025-02-11").toISOString(),
      );
      request.nextUrl.searchParams.set("type", "test_type");
      request.nextUrl.searchParams.set("unitSize", "not an integer");
    },
    async test({ fetch }) {
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(400);
      await expect(res.json()).resolves.toStrictEqual({
        message: "Unit size must be an integer",
      });
    },
  });
});

test("Should return 400 on missing parameters", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher(request) {
      request.nextUrl.searchParams.set("title", "test_title");
    },
    async test({ fetch }) {
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(400);
      await expect(res.json()).resolves.toStrictEqual({
        message: "Invalid search parameters",
      });
    },
  });
});

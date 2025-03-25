import "@/test/realDb";

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
// import { authMock } from "@/test/authMock";
import { validateSession, invalidateSession } from "@/test/util/authMockUtils";
import { db } from "@/db";
import { Item, ItemCategory, Prisma } from "@prisma/client";

const setup = async () => {
  const createMockItem = (
    title: string,
    type: string,
    category: ItemCategory,
    quantity: number,
    expirationDate: Date,
    unitSize: number,
    visible: boolean
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
      type,
      category,
      quantity,
      expirationDate,
      unitSize,
      visible,
      quantityPerUnit: null,
      donorShippingNumber: null,
      hfhShippingNumber: null,
      unitType: `Unit Type ${Math.floor(Math.random() * 3)}`,
      datePosted: new Date(Date.now() + Math.floor(Math.random() * 10000)),
      lotNumber: Math.floor(Math.random() * 100),
      palletNumber: Math.floor(Math.random() * 100),
      boxNumber: Math.floor(Math.random() * 100),
      donorName: "Chris Evans <3",
      unitPrice: new Prisma.Decimal(Math.random() * 100),
      maxRequestLimit: "abc",
      allowAllocations: false,
      gik: false,
      ndc: "",
      notes: "",
    };
  };

  const date1 = new Date("2025-02-11");
  const date2 = new Date("2025-02-12");
  const date3 = new Date("2000-01-01");

  const items = [
    createMockItem(
      "test_title",
      "test_type",
      "MEDICAL_SUPPLY",
      100,
      date1,
      5,
      true
    ),
    createMockItem(
      "test_title",
      "test_type",
      "MEDICAL_SUPPLY",
      20,
      date2,
      6,
      true
    ),
    createMockItem(
      "test_title",
      "test_type",
      "MEDICAL_SUPPLY",
      1,
      date3,
      7,
      false
    ),
    createMockItem(
      "test_title",
      "test_type",
      "MEDICAL_SUPPLY",
      15,
      date1,
      5,
      false
    ),
  ];
  await db.item.deleteMany({});
  await db.item.createMany({
    data: items,
  });
};

test("Should return 401 for invalid session", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      await setup();
      invalidateSession();

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(401);
      const json = await res.json();
      await expect(json).toEqual({ message: "Session required" });
    },
  });
});

test("Should return 200 for valid session", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      await setup();
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);
    },
  });
});

test("Should give correct database queries", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      await setup();
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);

      // Check that the response json was written correctly
      const expectedRet = [
        {
          title: "test_title",
          type: "test_type",
          quantity: 115,
          expirationDate: new Date("2025-02-11"),
          unitSize: 5,
        },
        {
          title: "test_title",
          type: "test_type",
          quantity: 20,
          expirationDate: new Date("2025-02-12"),
          unitSize: 6,
        },
        {
          title: "test_title",
          type: "test_type",
          quantity: 1,
          expirationDate: new Date("2000-01-01"),
          unitSize: 7,
        },
      ];
      const json = await res.json();
      await expect(json.items).toEqual(
        expect.arrayContaining(JSON.parse(JSON.stringify(expectedRet)))
      ); // Needed to stringify and parse because the expiration field would cause an error because Date != ISOstring
    },
  });
});

test("Should return 400 on invalid expirationDateAfter", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher(request) {
      request.nextUrl.searchParams.set("expirationDateAfter", "foo");
      request.nextUrl.searchParams.set(
        "expirationDateBefore",
        "2025-02-10T20:21:11+00:00"
      );
    },
    async test({ fetch }) {
      await setup();
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(400);
      await expect(res.json()).resolves.toStrictEqual({
        message: "expirationDateAfter must be a valid ISO-8601 timestamp",
      });
    },
  });
});

test("Should return 400 on invalid expirationDateBefore", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher(request) {
      request.nextUrl.searchParams.set(
        "expirationDateAfter",
        "2025-02-10T20:21:11+00:00"
      );
      request.nextUrl.searchParams.set("expirationDateBefore", "foo");
    },
    async test({ fetch }) {
      await setup();
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(400);
      await expect(res.json()).resolves.toStrictEqual({
        message: "expirationDateBefore must be a valid ISO-8601 timestamp",
      });
    },
  });
});

test("Should be successful when both expirationDateBefore, expirationDateAfter valid", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher(request) {
      request.nextUrl.searchParams.set(
        "expirationDateAfter",
        "2025-02-10T00:00:00.000Z"
      );
      request.nextUrl.searchParams.set(
        "expirationDateBefore",
        "2025-02-14T00:00:00.000Z"
      );
    },
    async test({ fetch }) {
      await setup();
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);

      const expectedRet = [
        {
          title: "test_title",
          type: "test_type",
          quantity: 115,
          expirationDate: new Date("2025-02-11"),
          unitSize: 5,
        },
        {
          title: "test_title",
          type: "test_type",
          quantity: 20,
          expirationDate: new Date("2025-02-12"),
          unitSize: 6,
        },
      ];
      const json = await res.json();
      await expect(json.items).toEqual(
        expect.arrayContaining(JSON.parse(JSON.stringify(expectedRet)))
      );
    },
  });
});

test("Should be successful when expirationDateBefore valid, expirationDateAfter missing", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher(request) {
      request.nextUrl.searchParams.set(
        "expirationDateBefore",
        "2025-02-14T00:00:00.000Z"
      );
    },
    async test({ fetch }) {
      await setup();
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);

      const expectedRet = [
        {
          title: "test_title",
          type: "test_type",
          quantity: 115,
          expirationDate: new Date("2025-02-11"),
          unitSize: 5,
        },
        {
          title: "test_title",
          type: "test_type",
          quantity: 20,
          expirationDate: new Date("2025-02-12"),
          unitSize: 6,
        },
      ];
      const json = await res.json();
      await expect(json.items).toEqual(
        expect.arrayContaining(JSON.parse(JSON.stringify(expectedRet)))
      );
    },
  });
});

test("Should be successful when expirationDateBefore missing, expirationDateAfter valid", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher(request) {
      request.nextUrl.searchParams.set(
        "expirationDateAfter",
        "2025-02-10T00:00:00.000Z"
      );
    },
    async test({ fetch }) {
      await setup();
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);

      const expectedRet = [
        {
          title: "test_title",
          type: "test_type",
          quantity: 115,
          expirationDate: new Date("2025-02-11"),
          unitSize: 5,
        },
        {
          title: "test_title",
          type: "test_type",
          quantity: 20,
          expirationDate: new Date("2025-02-12"),
          unitSize: 6,
        },
      ];
      const json = await res.json();
      await expect(json.items).toEqual(
        expect.arrayContaining(JSON.parse(JSON.stringify(expectedRet)))
      );
    },
  });
});

test("Should hide visible = false when requested by partner", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      await setup();
      validateSession("PARTNER");

      const res = await fetch({ method: "GET" });
      await expect(res.status).toBe(200);

      const expectedRet = [
        {
          title: "test_title",
          type: "test_type",
          quantity: 100,
          expirationDate: new Date("2025-02-11"),
          unitSize: 5,
        },
        {
          title: "test_title",
          type: "test_type",
          quantity: 20,
          expirationDate: new Date("2025-02-12"),
          unitSize: 6,
        },
      ];
      const json = await res.json();
      await expect(json.items).toEqual(
        expect.arrayContaining(JSON.parse(JSON.stringify(expectedRet)))
      );
    },
  });
});

import "@/test/realDb";

import { testApiHandler } from "next-test-api-route-handler";
import { expect, test } from "@jest/globals";
import { ItemCategory, RequestPriority, UserType } from "@prisma/client";
import { db } from "@/db";

import { invalidateSession, validateSession } from "@/test/util/authMockUtils";

import * as appHandler from "./route";
import { Decimal } from "@prisma/client/runtime/library";

test("returns 401 on unauthenticated", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      invalidateSession();

      const res = await fetch({
        method: "GET",
      });

      expect(res.status).toBe(401);
      expect(await res.json()).toStrictEqual({
        message: "Session required",
      });
    },
  });
});

test("returns 403 if not staff, admin, or super-admin", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession(UserType.PARTNER);

      const res = await fetch({
        method: "GET",
      });

      expect(res.status).toBe(403);
      expect(await res.json()).toStrictEqual({
        message: "Unauthorized",
      });
    },
  });
});

test("returns 400 if missing required query parameters", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession(UserType.ADMIN);

      const res = await fetch({
        method: "GET",
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toStrictEqual({
        message: "Missing required query parameters",
      });
    },
  });
});

test("returns 400 if expiration is not a date", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher: (request) => {
      return new Request(
        `${request.url}?title=rice&type=type&expiration=invalid-date&unitSize=5`
      );
    },
    async test({ fetch }) {
      validateSession(UserType.ADMIN);

      const res = await fetch({
        method: "GET",
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toStrictEqual({
        message: "Invalid expiration parameter",
      });
    },
  });
});

test("returns 400 if unitSize is not a number", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher: (request) => {
      return new Request(
        `${request.url}?title=rice&type=type&expiration=2023-01-01T00:00:00.000Z&unitSize=h`
      );
    },

    async test({ fetch }) {
      validateSession(UserType.ADMIN);

      const res = await fetch({
        method: "GET",
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toStrictEqual({
        message: "Invalid unitSize parameter",
      });
    },
  });
});

test("returns 200 with all requests for staff", async () => {
  await testApiHandler({
    appHandler,
    requestPatcher: (request) => {
      return new Request(
        `${request.url}?title=rice&type=type&expiration=2025-03-15T07:00:00.000Z&unitSize=5`
      );
    },
    async test({ fetch }) {
      validateSession(UserType.STAFF);

      const partner1 = await db.user.create({
        data: {
          email: "partner1@test.com",
          name: "Partner 1",
          passwordHash: "hash1",
          type: UserType.PARTNER,
          enabled: true,
        },
      });
      const partner2 = await db.user.create({
        data: {
          email: "partner2@test.com",
          name: "Partner 2",
          passwordHash: "hash2",
          type: UserType.PARTNER,
          enabled: true,
        },
      });

      const item1 = await db.item.create({
        data: {
          title: "Item 1",
          type: "Type 1",
          expirationDate: new Date("2025-12-31"),
          unitSize: 10,
          category: ItemCategory.MEDICAL_SUPPLY,
          donorName: "Donor 1",
          quantity: 100,
          lotNumber: 1,
          palletNumber: 1,
          boxNumber: 1,
          quantityPerUnit: "10 tablets",
          unitType: "bottle",
          unitPrice: new Decimal(10.0),
          maxRequestLimit: "100",
          donorShippingNumber: "SHIP123",
          hfhShippingNumber: "HFH456",
          datePosted: new Date(),
          ndc: "12345-678-90",
          notes: "Sample notes",
          allowAllocations: true,
          visible: true,
          gik: false,
        },
      });
      const item2 = await db.item.create({
        data: {
          title: "Item 2",
          type: "Type 2",
          expirationDate: new Date("2026-01-15"),
          unitSize: 20,
          category: ItemCategory.MEDICATION,
          donorName: "Donor 2",
          quantity: 200,
          lotNumber: 2,
          palletNumber: 2,
          boxNumber: 2,
          quantityPerUnit: "50 ml",
          unitType: "vial",
          unitPrice: new Decimal(20.0),
          maxRequestLimit: "200",
          donorShippingNumber: "SHIP456",
          hfhShippingNumber: "HFH789",
          datePosted: new Date(),
          ndc: "09876-543-21",
          notes: "Another sample note",
          allowAllocations: true,
          visible: true,
          gik: false,
        },
      });

      const req1 = await db.unallocatedItemRequest.create({
        data: {
          title: "rice",
          type: "type",
          expirationDate: new Date("2025-03-15T07:00:00.000Z"),
          priority: RequestPriority.HIGH,
          unitSize: 5,
          quantity: 10,
          createdAt: new Date(),
          comments: "Test comment",
          partnerId: partner1.id,
        },
      });
      const req2 = await db.unallocatedItemRequest.create({
        data: {
          title: "beans",
          type: "type2",
          expirationDate: new Date("2025-04-01T07:00:00.000Z"),
          priority: RequestPriority.MEDIUM,
          unitSize: 10,
          quantity: 20,
          createdAt: new Date(),
          comments: "Another test comment",
          partnerId: partner2.id,
        },
      });

      const alloc1 = await db.unallocatedItemRequestAllocation.create({
        data: {
          quantity: 5,
          unallocatedItemRequestId: req1.id,
          itemId: item1.id,
        },
      });
      await db.unallocatedItemRequestAllocation.create({
        data: {
          quantity: 10,
          unallocatedItemRequestId: req2.id,
          itemId: item2.id,
        },
      });

      const res = await fetch({
        method: "GET",
      });

      expect(res.status).toBe(200);
      const resp = (await res.json()).requests;
      expect(resp[0].id).toBe(req1.id);
      expect(resp[0].allocations[0].id).toBe(alloc1.id);
      expect(resp[0].allocations[0].itemId).toBe(item1.id);
    },
  });
});

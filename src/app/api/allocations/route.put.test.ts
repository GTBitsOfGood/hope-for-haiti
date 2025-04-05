import { dbMock } from "@/test/dbMock";
import { authMock } from "@/test/authMock";
import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test, describe } from "@jest/globals";
import {
  UserType,
  ItemCategory,
  Item,
  UnallocatedItemRequestAllocation,
} from "@prisma/client";
import { Prisma } from "@prisma/client";

function getValidFormData() {
  const form = new FormData();
  form.append("allocationId", "1");
  form.append("title", "Canned Soup");
  form.append("type", "Type");
  form.append("expiration", "2025-12-12T00:00:00.000Z");
  form.append("unitSize", "1");
  form.append("donorName", "Donor 1");
  form.append("lotNumber", "100");
  form.append("palletNumber", "20");
  form.append("boxNumber", "5");
  form.append("quantity", "5");
  return form;
}

describe.skip("PUT /api/allocations", () => {
  test("returns 400 if required fields are missing", async () => {
    authMock.mockReturnValueOnce({
      user: { id: "user-123", type: UserType.ADMIN },
      expires: "",
    });

    const form = new FormData();
    form.append("title", "Canned Soup");

    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const res = await fetch({ method: "PUT", body: form });
        expect(res.status).toBe(400);
      },
    });
  });

  const unallocatedItemRequestAllocation: UnallocatedItemRequestAllocation = {
    id: 1,
    unallocatedItemRequestId: 1,
    itemId: 1,
    quantity: 10,
    partnerId: null,
    visible: true,
  };

  test("returns 404 if no matching item exists", async () => {
    authMock.mockReturnValueOnce({
      user: { id: "user-123", type: UserType.ADMIN },
      expires: "",
    });

    dbMock.unallocatedItemRequestAllocation.findUnique.mockResolvedValueOnce(
      unallocatedItemRequestAllocation
    );
    dbMock.item.findFirst.mockResolvedValueOnce(null);

    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const res = await fetch({ method: "PUT", body: getValidFormData() });
        expect(res.status).toBe(404);
        await expect(res.json()).resolves.toEqual({
          message: "Item not found with the specified attributes.",
        });
      },
    });
  });

  const mockItem: Item = {
    id: 1,
    title: "Canned Soup",
    type: "Type",
    expirationDate: new Date("2025-12-12T00:00:00.000Z"),
    unitSize: 1,
    quantity: 10,
    category: ItemCategory.NON_MEDICAL,
    donorName: "Donor 1",
    lotNumber: 100,
    palletNumber: 20,
    boxNumber: 5,
    quantityPerUnit: null,
    unitType: null,
    unitPrice: new Prisma.Decimal(0),
    maxRequestLimit: null,
    donorShippingNumber: null,
    hfhShippingNumber: null,
    datePosted: new Date(),
    allowAllocations: true,
    visible: true,
    gik: false,
    ndc: null,
    notes: null,
    donorOfferItemId: null,
  };

  test("Should return 400 if there aren't enough items", async () => {
    authMock.mockReturnValueOnce({
      user: { id: "user-123", type: UserType.ADMIN },
      expires: "",
    });
    dbMock.item.findFirst.mockResolvedValueOnce(mockItem);
    dbMock.unallocatedItemRequestAllocation.findUnique.mockResolvedValueOnce(
      unallocatedItemRequestAllocation
    );
    dbMock.unallocatedItemRequestAllocation.aggregate.mockResolvedValueOnce({
      _sum: { quantity: 6 },
      _count: undefined,
      _avg: undefined,
      _min: undefined,
      _max: undefined,
    });

    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const res = await fetch({ method: "PUT", body: getValidFormData() });
        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({
          message:
            "Not enough items in inventory to fulfill the allocation request.",
        });
      },
    });
  });

  test("returns 200 and creates allocation on success", async () => {
    authMock.mockReturnValueOnce({
      user: { id: "user-123", type: UserType.ADMIN },
      expires: "",
    });

    dbMock.item.findFirst.mockResolvedValueOnce(mockItem);
    dbMock.unallocatedItemRequestAllocation.findUnique.mockResolvedValueOnce(
      unallocatedItemRequestAllocation
    );
    dbMock.unallocatedItemRequestAllocation.aggregate.mockResolvedValueOnce({
      _sum: { quantity: 3 },
      _count: undefined,
      _avg: undefined,
      _min: undefined,
      _max: undefined,
    });
    dbMock.unallocatedItemRequestAllocation.update.mockResolvedValueOnce({
      ...unallocatedItemRequestAllocation,
      quantity: 5,
    });

    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const res = await fetch({ method: "PUT", body: getValidFormData() });
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({
          message: "Allocation request modified",
          unallocatedItemRequestAllocation: {
            ...unallocatedItemRequestAllocation,
            quantity: 5,
          },
        });
      },
    });
  });
});

import { dbMock } from "@/test/dbMock";
import { authMock } from "@/test/authMock";
import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test, describe } from "@jest/globals";
import { UserType, ItemCategory } from "@prisma/client";
import { Prisma } from "@prisma/client";

type UnallocatedItemRequestAllocation = {
  id: number;
  quantity: number;
  unallocatedItemRequestId: number;
  itemId: number;
};

type FullItem = {
  id: number;
  title: string;
  type: string;
  expirationDate: Date | null;
  unitSize: number;
  quantity: number;
  category: ItemCategory;
  donorName: string;
  lotNumber: number;
  palletNumber: number;
  boxNumber: number;
  quantityPerUnit: string | null;
  unitType: string | null;
  unitPrice: Prisma.Decimal;
  maxRequestLimit: string | null;
  donorShippingNumber: string | null;
  hfhShippingNumber: string | null;
  datePosted: Date;
  allowAllocations: boolean;
  visible: boolean;
  gik: boolean;
  unallocatedItemRequestAllocations: UnallocatedItemRequestAllocation[];
  createdAt?: Date;
  updatedAt?: Date;
};

function getValidFormData() {
  const form = new FormData();
  form.append("unallocatedItemRequestId", "1");
  form.append("title", "Canned Soup");
  form.append("type", "Type");
  form.append("expiration", "2025-12-12T00:00:00.000Z");
  form.append("unitSize", "1");
  form.append("donorName", "Donor 1");
  form.append("lotNumber", "100");
  form.append("palletNumber", "20");
  form.append("boxNumber", "5");
  form.append("quantity", "10");
  return form;
}

describe("POST /api/allocations", () => {
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
        const res = await fetch({ method: "POST", body: form });
        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({
          message: "Missing one or more required fields.",
        });
      },
    });
  });

  test("returns 404 if no matching item exists", async () => {
    authMock.mockReturnValueOnce({
      user: { id: "user-123", type: UserType.ADMIN },
      expires: "",
    });

    dbMock.item.findFirst.mockResolvedValueOnce(null);

    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const res = await fetch({ method: "POST", body: getValidFormData() });
        expect(res.status).toBe(404);
        await expect(res.json()).resolves.toEqual({
          message: "Item not found with the specified attributes.",
        });
      },
    });
  });

  test("returns 200 and creates allocation on success", async () => {
    authMock.mockReturnValueOnce({
      user: { id: "user-123", type: UserType.ADMIN },
      expires: "",
    });

    const mockItem: FullItem = {
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
      unallocatedItemRequestAllocations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dbMock.item.findFirst.mockResolvedValueOnce(mockItem);
    dbMock.unallocatedItemRequestAllocation.create.mockResolvedValueOnce({
      id: 1,
      unallocatedItemRequestId: 1,
      itemId: 1,
      quantity: 10,
    });

    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const res = await fetch({ method: "POST", body: getValidFormData() });
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({
          message: "Allocation created",
          allocation: {
            id: 1,
            unallocatedItemRequestId: 1,
            itemId: 1,
            quantity: 10,
          },
        });
      },
    });
  });
});

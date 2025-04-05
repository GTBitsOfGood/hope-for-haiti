import { dbMock } from "@/test/dbMock";
jest.mock("@/db", () => ({ db: dbMock }));
import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test, describe } from "@jest/globals";
import { authMock } from "@/test/authMock";
import { UserType, Prisma } from "@prisma/client";

function getValidUrl({
  title = "Canned Soup",
  type = "Type",
  expiration = "2025-12-12T00:00:00.000Z",
  unitSize = "1",
  donorName,
  lotNumber,
  palletNumber,
  boxNumber,
}: {
  title?: string;
  type?: string;
  expiration?: string;
  unitSize?: string;
  donorName?: string;
  lotNumber?: string;
  palletNumber?: string;
  boxNumber?: string;
} = {}) {
  const params = new URLSearchParams({
    title,
    type,
    expiration,
    unitSize,
  });
  if (donorName) params.append("donorName", donorName);
  if (lotNumber) params.append("lotNumber", lotNumber);
  if (palletNumber) params.append("palletNumber", palletNumber);
  if (boxNumber) params.append("boxNumber", boxNumber);

  return `/api/allocations/itemSearch?${params.toString()}`;
}

describe("GET /api/allocations/itemSearch", () => {
  test("returns 400 if required query params are missing", async () => {
    authMock.mockReturnValueOnce({
      user: { id: "2", type: UserType.ADMIN },
      expires: "",
    });

    await testApiHandler({
      appHandler,
      url: "/api/allocations/itemSearch?title=Soup&type=Type&expiration=2025-12-12T00:00:00.000Z",
      async test({ fetch }) {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json).toEqual({
          message:
            "Missing required query params: title, type, expiration, unitSize",
        });
      },
    });
  });

  test("returns 200 and correct arrays on success", async () => {
    authMock.mockReturnValueOnce({
      user: { id: "1", type: UserType.SUPER_ADMIN },
      expires: "",
    });

    dbMock.item.findMany.mockResolvedValueOnce([
      {
        id: 1,
        title: "Canned Soup",
        type: "Type",
        expirationDate: new Date("2025-12-12T00:00:00.000Z"),
        unitSize: 1,
        category: "NON_MEDICAL",
        donorName: "Donor 1",
        quantity: 10,
        lotNumber: 101,
        palletNumber: 10,
        boxNumber: 1,
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
      },
      {
        id: 2,
        title: "Canned Soup",
        type: "Type",
        expirationDate: new Date("2025-12-12T00:00:00.000Z"),
        unitSize: 1,
        category: "NON_MEDICAL",
        donorName: "Donor 2",
        quantity: 10,
        lotNumber: 201,
        palletNumber: 20,
        boxNumber: 2,
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
      },
    ]);

    await testApiHandler({
      appHandler,
      url: getValidUrl({
        title: "Canned Soup",
        type: "Type",
        expiration: "2025-12-12T00:00:00.000Z",
        unitSize: "1",
      }),
      async test({ fetch }) {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toEqual({
          donorNames: ["Donor 1", "Donor 2"],
          lotNumbers: [101, 201],
          palletNumbers: [10, 20],
          boxNumbers: [1, 2],
        });
      },
    });
  });
});

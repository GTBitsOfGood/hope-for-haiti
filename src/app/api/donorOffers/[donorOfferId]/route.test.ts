import "@/test/realDb";

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
import { invalidateSession, validateSession } from "@/test/util/authMockUtils";
import { db } from "@/db";
import { DonorOfferState } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let snapshot: any;

beforeEach(async () => {
  snapshot = [
    await db.donorOfferItem.findMany(),
    await db.donorOffer.findMany(),
  ];

  await db.donorOfferItem.deleteMany();
  await db.donorOffer.deleteMany();
});

afterEach(async () => {
  await db.donorOfferItem.deleteMany();
  await db.donorOffer.deleteMany();

  await db.donorOffer.createMany({
    data: snapshot[1],
  });
  await db.donorOfferItem.createMany({
    data: snapshot[0],
  });
});

test("Should return 401 if session is invalid", async () => {
  await testApiHandler({
    appHandler,
    params: { donorOfferId: "1234" },
    test: async ({ fetch }) => {
      invalidateSession();
      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(401);
    },
  });
});

test("Should return 403 if session is not a partner", async () => {
  await testApiHandler({
    appHandler,
    params: { donorOfferId: "1234" },
    test: async ({ fetch }) => {
      validateSession("ADMIN");
      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(403);
    },
  });

  await testApiHandler({
    appHandler,
    params: { donorOfferId: "1234" },
    test: async ({ fetch }) => {
      validateSession("SUPER_ADMIN");
      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(403);
    },
  });

  await testApiHandler({
    appHandler,
    params: { donorOfferId: "1234" },
    test: async ({ fetch }) => {
      validateSession("STAFF");
      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(403);
    },
  });
});

test("Should return 404 if donor offer does not exist", async () => {
  await testApiHandler({
    appHandler,
    params: { donorOfferId: "1234" },
    test: async ({ fetch }) => {
      validateSession("PARTNER");
      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(404);
    },
  });
});

test("Should return donor offer items", async () => {
  // Create donor offers
  await db.donorOffer.createMany({
    data: [
      {
        id: 135,
        donorName: "donorName 1",
        offerName: "offerName 1",
        responseDeadline: new Date(),
        state: DonorOfferState.FINALIZED,
      },
      {
        id: 244,
        donorName: "donorName 2",
        offerName: "offerName 2",
        responseDeadline: new Date(),
        state: DonorOfferState.FINALIZED,
      },
    ],
  });

  const returnItems = [
    {
      title: "title 1",
      type: "type 1",
      expiration: new Date(1000000),
      quantity: 1,
      unitSize: "unitSize",
    },
    {
      title: "title 2",
      type: "type 2",
      expiration: new Date(2000000),
      quantity: 5,
      unitSize: "unitSize",
    },
  ];
  await db.donorOfferItem.createMany({
    data: returnItems.map((item) => ({
      title: item.title,
      type: item.type,
      expiration: item.expiration,
      quantity: item.quantity,
      unitSize: item.unitSize,
      donorOfferId: 135,
    })),
  });

  const notReturnItems = [
    {
      title: "title 3",
      type: "type 3",
      expiration: new Date(3000000),
      quantity: 1,
      unitSize: "unitSize",
    },
    {
      title: "title 4",
      type: "type 4",
      expiration: new Date(4000000),
      quantity: 5,
      unitSize: "unitSize",
    },
  ];
  await db.donorOfferItem.createMany({
    data: notReturnItems.map((item) => ({
      title: item.title,
      type: item.type,
      expiration: item.expiration,
      quantity: item.quantity,
      unitSize: item.unitSize,
      donorOfferId: 244,
    })),
  });

  await testApiHandler({
    appHandler,
    params: { donorOfferId: "135" },
    test: async ({ fetch }) => {
      validateSession("PARTNER");
      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toStrictEqual(
        returnItems.map((item) => ({
          ...item,
          expiration: item.expiration.toISOString(),
        }))
      );
    },
  });
});

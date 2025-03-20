import "@/test/realDb";

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { beforeEach, expect, test } from "@jest/globals";
import { invalidateSession, validateSession } from "@/test/util/authMockUtils";
import { db } from "@/db";
import { DonorOfferState, UserType } from "@prisma/client";
import { format } from "date-fns";

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

test("Should return 401 for no session", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      invalidateSession();

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(401);
    },
  });
});

test("Should be invalid for not PARTNER user", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("ADMIN");

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(403);
    },
  });

  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("STAFF");

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(403);
    },
  });

  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession(UserType.SUPER_ADMIN);

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(403);
    },
  });
});

test("Should return donor offers for PARTNER", async () => {
  const donorOffers = [
    {
      offerName: "offer1",
      donorName: "donor1",
      responseDeadline: new Date(),
      state: DonorOfferState.ARCHIVED,
    },
    {
      offerName: "offer2",
      donorName: "donor2",
      responseDeadline: new Date(),
      state: DonorOfferState.UNFINALIZED,
    },
  ];

  await db.donorOffer.createMany({
    data: donorOffers,
  });

  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession(UserType.PARTNER);

      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual(
        donorOffers.map((offer) => {
          return {
            donorOfferId: expect.any(Number),
            offerName: offer.offerName,
            donorName: offer.donorName,
            responseDeadline: format(offer.responseDeadline, "MM/dd/yyyy"),
            state: offer.state,
          };
        })
      );
    },
  });
});

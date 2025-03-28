import { dbMock } from "@/test/dbMock";
import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
import { invalidateSession, validateSession } from "@/test/util/authMockUtils";
import { DonorOfferState, UserType } from "@prisma/client";
import { format } from "date-fns";

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
      id: 1,
      offerName: "offer1",
      donorName: "donor1",
      responseDeadline: new Date(),
      state: DonorOfferState.ARCHIVED,
    },
    {
      id: 2,
      offerName: "offer2",
      donorName: "donor2",
      responseDeadline: new Date(),
      state: DonorOfferState.UNFINALIZED,
    },
  ];

  dbMock.donorOffer.findMany.mockResolvedValue(donorOffers);

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
            donorOfferId: offer.id,
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

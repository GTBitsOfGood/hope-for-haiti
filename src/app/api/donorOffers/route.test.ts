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

test("Should return donor offers for PARTNER", async () => {
  const responseDeadline = new Date("2025-04-05T18:56:10.760Z");
  const donorOffers = [
    {
      id: 1,
      offerName: "offer1",
      donorName: "donor1",
      partnerResponseDeadline: responseDeadline,
      donorResponseDeadline: responseDeadline,
      state: DonorOfferState.ARCHIVED,
      partnerVisibilities: [
        {
          partnerId: 1,
          partner: {
            id: 1,
            name: "Partner 1",
            email: "partner1@example.com",
          },
        },
      ],
      items: [
        {
          id: 1,
          requests: [
            {
              partnerId: 1,
            },
          ],
        },
      ],
    },
    {
      id: 2,
      offerName: "offer2",
      donorName: "donor2",
      partnerResponseDeadline: responseDeadline,
      donorResponseDeadline: responseDeadline,
      state: DonorOfferState.UNFINALIZED,
      partnerVisibilities: [
        {
          partnerId: 2,
          partner: {
            id: 2,
            name: "Partner 2",
            email: "partner2@example.com",
          },
        },
      ],
      items: [
        {
          id: 2,
          requests: [],
        },
      ],
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
            responseDeadline: responseDeadline.toISOString(),
            state: offer.state,
          };
        })
      );
    },
  });
});

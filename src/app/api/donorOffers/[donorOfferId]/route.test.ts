import { dbMock } from "@/test/dbMock";

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
import { invalidateSession, validateSession } from "@/test/util/authMockUtils";
import { DonorOfferState, RequestPriority } from "@prisma/client";
import { format } from "date-fns";
import {
  DonorOfferItemsRequestsDTO,
  DonorOfferItemsRequestsResponse,
} from "./types";

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

/* eslint-disable @typescript-eslint/no-explicit-any */
test("Should return donor offer items", async () => {
  // Create donor offers
  dbMock.donorOffer.findUnique.mockImplementation((args) => {
    if (args && args.where && args.where.id === 135) {
      return {
        then: (resolve: any) =>
          resolve({
            id: 135,
            donorName: "donorName 1",
            offerName: "offerName 1",
            responseDeadline: new Date(),
            state: DonorOfferState.FINALIZED,
          }),
      } as any;
    } else if (args && args.where && args.where.id === 244) {
      return {
        then: (resolve: any) =>
          resolve({
            id: 244,
            donorName: "donorName 2",
            offerName: "offerName 2",
            responseDeadline: new Date(),
            state: DonorOfferState.FINALIZED,
          }),
      } as any;
    } else {
      return {
        then: (resolve: any) => resolve(null),
      } as any;
    }
  });

  const returnItems = [
    {
      id: 44,
      title: "title 1",
      type: "type 1",
      expiration: new Date(1000000),
      quantity: 1,
      unitSize: "unitSize",
    },
    {
      id: 103,
      title: "title 2",
      type: "type 2",
      expiration: new Date(2000000),
      quantity: 5,
      unitSize: "unitSize",
    },
  ];

  const notReturnItems = [
    {
      id: 80,
      title: "title 3",
      type: "type 3",
      expiration: new Date(3000000),
      quantity: 1,
      unitSize: "unitSize",
    },
    {
      id: 125,
      title: "title 4",
      type: "type 4",
      expiration: new Date(4000000),
      quantity: 5,
      unitSize: "unitSize",
    },
  ];

  dbMock.donorOfferItem.findMany.mockImplementation((args) => {
    if (args && args.where && args.where.donorOfferId === 135) {
      return {
        then: (resolve: any) => resolve(returnItems),
      } as any;
    } else if (args && args.where && args.where.donorOfferId === 244) {
      return {
        then: (resolve: any) => resolve(notReturnItems),
      } as any;
    } else {
      return {
        then: (resolve: any) => resolve(returnItems.concat(notReturnItems)),
      } as any;
    }
  });

  const returnRequests = [
    {
      id: 320,
      donorOfferItemId: 44,
      quantity: 1,
      comments: "comments 1",
      priority: RequestPriority.HIGH,
    },
    {
      id: 403,
      donorOfferItemId: 44,
      quantity: 1,
      comments: "comments 1",
      priority: RequestPriority.MEDIUM,
    },
    {
      id: 234,
      donorOfferItemId: 103,
      quantity: 5,
      comments: "comments 2",
      priority: RequestPriority.LOW,
    },
  ];
  const notReturnRequests = [
    {
      id: 322,
      donorOfferItemId: 80,
      quantity: 1,
      comments: "comments 3",
      priority: RequestPriority.HIGH,
    },
  ];

  dbMock.donorOfferItemRequest.findMany.mockImplementation((args) => {
    if (args && args.where && args.where.donorOfferItemId) {
      const id = args.where.donorOfferItemId as number;
      const returnRequests2 = returnRequests.filter(
        (request) => request.donorOfferItemId === id
      );
      return {
        [Symbol.toStringTag]: "PrismaPromise",
        then: (resolve: any) => resolve(returnRequests2), // This filter thing is probably the problem
      } as any;
    } else {
      return {
        [Symbol.toStringTag]: "PrismaPromise",
        then: (resolve: any) =>
          resolve(returnRequests.concat(notReturnRequests)),
      } as any;
    }
  });

  const expectedResponse = {
    donorOfferName: "offerName 1",
    donorOfferItemsRequests: [],
  } as DonorOfferItemsRequestsResponse;
  for (const req of returnRequests) {
    const item = returnItems.find((item) => item.id === req.donorOfferItemId);
    if (!item) {
      continue;
    }
    expectedResponse.donorOfferItemsRequests.push({
      requestId: req.id,
      title: item.title,
      type: item.type,
      expiration: format(item.expiration, "MM/dd/yyyy"),
      quantity: item.quantity,
      unitSize: item.unitSize,
      quantityRequested: req.quantity,
      comments: req.comments,
      priority: req.priority,
    } as DonorOfferItemsRequestsDTO);
  }

  await testApiHandler({
    appHandler,
    params: { donorOfferId: "135" },
    test: async ({ fetch }) => {
      validateSession("PARTNER");
      const res = await fetch({ method: "GET" });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toStrictEqual(expectedResponse);
    },
  });
});

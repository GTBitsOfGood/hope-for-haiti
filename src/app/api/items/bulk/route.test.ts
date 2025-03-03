import "@/test/realDb";

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
import { invalidateSession, validateSession } from "@/test/util/authMockUtils";
import { db } from "@/db";

test("Should return 401 for no session", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      invalidateSession();

      const res = await fetch({ method: "POST" });
      expect(res.status).toBe(401);
    },
  });
});

test("Should return 403 if sessions is PARTNER or STAFF", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("PARTNER");

      const res = await fetch({ method: "POST" });
      expect(res.status).toBe(403);
    },
  });

  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("STAFF");

      const res = await fetch({ method: "POST" });
      expect(res.status).toBe(403);
    },
  });
});

test("Should return 200 if session is ADMIN or SUPER_ADMIN", async () => {
  const items = [
    {
      title: "some item",
      category: "some category",
      quantity: 2,
      expirationDate: new Date(1000),
      unitSize: 5,
      unitType: "bunches",
      datePosted: new Date(1000),
      lotNumber: 4,
      palletNumber: 5,
      boxNumber: 3,
      donorName: "John Doe",
      unitPrice: 5,
      maxRequestLimit: "5",
    },
  ];
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("ADMIN");

      const res = await fetch({
        method: "POST",
        body: JSON.stringify({ items }),
      });
      expect(res.status).toBe(200);
    },
  });

  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("SUPER_ADMIN");

      const res = await fetch({
        method: "POST",
        body: JSON.stringify({ items }),
      });
      expect(res.status).toBe(200);
    },
  });
});

test("Should return 400 if invalid form data", async () => {
  const items = [
    {
      title: "some item",
      category: "some category",
      quantity: 2,
      expirationDate: new Date(1000),
      unitSize: 5,
      unitType: "bunches",
      datePosted: new Date(1000),
    },
  ];
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("SUPER_ADMIN");

      const preLength = (await db.item.findMany()).length;
      const res = await fetch({
        method: "POST",
        body: JSON.stringify({ items }),
      });
      expect(res.status).toBe(400);
      expect((await db.item.findMany()).length).toBe(preLength);
    },
  });
});

test("Should create items for valid form data", async () => {
  // Clear the database
  await db.item.deleteMany(); // Added this line because cmd + s in vscode not clearing the db

  const items = [
    {
      title: "some item",
      category: "some category",
      quantity: 2,
      expirationDate: new Date(1000),
      unitSize: 5,
      unitType: "bunches",
      datePosted: new Date(1000),
      lotNumber: 4,
      palletNumber: 5,
      boxNumber: 3,
      donorName: "John Doe",
      unitPrice: 5,
      maxRequestLimit: "5",
    },
    {
      title: "some item 2",
      category: "some category 2",
      quantity: 4,
      expirationDate: new Date(2000),
      unitSize: 10,
      unitType: "bunches 2",
      datePosted: new Date(100),
      lotNumber: 200,
      palletNumber: 30,
      boxNumber: 45,
      donorName: "John Doe Jr.",
      unitPrice: 100000,
      maxRequestLimit: "500",
    },
  ];
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("ADMIN");

      const preLength = (await db.item.findMany()).length;
      const res = await fetch({
        method: "POST",
        body: JSON.stringify({ items }),
      });
      expect(res.status).toBe(200);

      const createdItems = (await db.item.findMany()).map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ id, visible, ...rest }) => ({
          ...rest,
          unitPrice: rest.unitPrice.toNumber(),
        })
      );
      expect(createdItems).toHaveLength(preLength + 2);
      expect(createdItems).toEqual(items);
    },
  });
});

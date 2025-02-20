import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
import { validateSession, invalidateSession } from "@/test/util/authMockUtils";
import { dbMock } from "@/test/dbMock";
import { createUnclaimedItem } from "@/test/util/dbMockUtils";

/**
 * Form data: {
 *   unallocatedItemId: "1",
 *   quantity: "1",
 *   comment: "comment"
 * }
 * @returns FormData with good data by default, but can be modified
 */
function getFormData({
  unallocatedItemId = "1",
  quantity = "1",
  comment = "comment",
}: {
  unallocatedItemId?: string;
  quantity?: string;
  comment?: string;
} = {}) {
  const formData = new FormData();
  formData.append("unallocatedItemId", unallocatedItemId);
  formData.append("quantity", quantity);
  formData.append("comment", comment);
  return formData;
}

test("Should return 401 for invalid session", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      invalidateSession();

      const res = await fetch({ method: "POST" });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toEqual({ message: "Session required" });
    },
  });
});

test("Should return 403 if not a partner", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("STAFF");

      const res = await fetch({ method: "POST" });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json).toEqual({ message: "Unauthorized" });
    },
  });
});

test("Should return 404 if unallocated item not found", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("PARTNER");

      dbMock.item.findUnique.mockResolvedValue(null);

      const res = await fetch({ method: "POST", body: getFormData() });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json).toEqual({ message: "Unallocated item not found" });
    },
  });
});

test("Should return 400 for bad form data", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("PARTNER");

      const badFormData = new FormData();
      badFormData.append("unallocatedItemIdBad", "1");
      badFormData.append("quantity", "1");
      badFormData.append("comment", "comment");

      const res = await fetch({ method: "POST", body: badFormData });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json).toEqual({ message: "Invalid form data" });
    },
  });
});

test("Should return 400 for too low quantity", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("PARTNER");

      const res = await fetch({
        method: "POST",
        body: getFormData({ quantity: "0" }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json).toEqual({ message: "Invalid form data" });
    },
  });
});

test("Should return 400 for requesting too many items", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("PARTNER");

      dbMock.item.findUnique.mockResolvedValue(
        await createUnclaimedItem({ id: 1, quantity: 1 })
      );

      const res = await fetch({
        method: "POST",
        body: getFormData({ quantity: "2" }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json).toEqual({ message: "Not enough items for request" });
    },
  });
});

test("Should return 200 for successful request", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("PARTNER");

      dbMock.item.findUnique.mockResolvedValue(
        await createUnclaimedItem({ id: 1, quantity: 2 })
      );

      const res = await fetch({ method: "POST", body: getFormData() });
      expect(res.status).toBe(200);
    },
  });
});

test("Should create unallocated item request on success", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      const session = await validateSession("PARTNER");

      dbMock.item.findUnique.mockResolvedValue(
        await createUnclaimedItem({ id: 1, quantity: 2 })
      );

      const res = await fetch({
        method: "POST",
        body: getFormData({
          unallocatedItemId: "1",
          quantity: "1",
          comment: "comment",
        }),
      });
      expect(res.status).toBe(200);

      // For now, this is the only way I know to check if the create method was called
      expect(dbMock.unallocatedItemRequest.create).toHaveBeenCalledWith({
        data: {
          itemId: 1,
          partnerId: parseInt(session.user.id),
          quantity: 1,
          comments: "comment",
        },
      });
    },
  });
});

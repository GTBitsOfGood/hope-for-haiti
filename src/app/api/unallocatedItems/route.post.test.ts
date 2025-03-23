import { dbMock } from "@/test/dbMock";

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
import { validateSession, invalidateSession } from "@/test/util/authMockUtils";
import { RequestPriority } from "@prisma/client";

/**
 * Form data: {
 *   title: "test-title",
 *   type: "doo dad",
 *   priority: "HIGH",
 *   expirationDate: undefined,
 *   unitSize: "10",
 *   quantity: "1",
 *   comments: "comments",
 * }
 * @returns FormData with good data by default, but can be modified
 */
function getFormData({
  title = "test-title",
  type = "doo dad",
  priority = RequestPriority.HIGH,
  expirationDate = undefined,
  unitSize = "10",
  quantity = "1",
  comments = "comments",
}: {
  title?: string;
  type?: string;
  priority?: RequestPriority;
  expirationDate?: string;
  unitSize?: string;
  quantity?: string;
  comments?: string;
} = {}) {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("type", type);
  formData.append("priority", priority);
  if (expirationDate) {
    formData.append("expirationDate", expirationDate);
  }
  formData.append("unitSize", unitSize);
  formData.append("quantity", quantity);
  formData.append("comments", comments);
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

test("Should return 400 for bad form data", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("PARTNER");

      const badFormData = getFormData({ expirationDate: "bad-date" });

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

test("Should return 200 for successful request", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      validateSession("PARTNER");

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

      const res = await fetch({
        method: "POST",
        body: getFormData({
          expirationDate: "2025-02-10T20:21:11+00:00",
        }),
      });
      expect(res.status).toBe(200);

      // For now, this is the only way I know to check if the create method was called
      expect(dbMock.unallocatedItemRequest.create).toHaveBeenCalledWith({
        data: {
          title: "test-title",
          type: "doo dad",
          priority: RequestPriority.HIGH,
          expirationDate: new Date("2025-02-10T20:21:11+00:00"),
          unitSize: 10,
          quantity: 1,
          comments: "comments",
          partnerId: parseInt(session.user.id),
        },
      });
    },
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
//Lint gets angry when "as any" is used, but it is necessary for mocking Prisma responses using the "select" parameter (for now).
import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";

import { expect, test } from "@jest/globals";
import { dbMock } from "@/test/dbMock";
import { authMock } from "@/test/authMock";
import { OrganizationType, UserType } from "@prisma/client";

test("returns 401 on invalid session", async () => {
  await testApiHandler({
    appHandler,
    paramsPatcher: (params) => ({ ...params, userId: "1234" }),
    async test({ fetch }) {
      // Mock invalid session
      authMock.mockReturnValueOnce(null);

      const res = await fetch({ method: "GET", body: null });
      await expect(res.status).toBe(401);
      await expect(res.json()).resolves.toStrictEqual({
        message: "Session required",
      });
    },
  });
});

test("returns 403 on unauthorized", async () => {
  await testApiHandler({
    appHandler,
    paramsPatcher: (params) => ({ ...params, userId: "1234" }),
    async test({ fetch }) {
      // User id different from session user id
      authMock.mockReturnValueOnce({
        user: { id: "4321", type: UserType.PARTNER },
        expires: "",
      });

      const res = await fetch({ method: "GET", body: null });
      await expect(res.status).toBe(403);
      await expect(res.json()).resolves.toStrictEqual({
        message: "You are not allowed to view this",
      });
    },
  });
});

test("returns 404 on not found", async () => {
  await testApiHandler({
    appHandler,
    paramsPatcher: (params) => ({ ...params, userId: "1234" }),
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: UserType.PARTNER },
        expires: "",
      });

      // Mock record not found
      dbMock.partnerDetails.findUnique.mockResolvedValueOnce(null);

      const res = await fetch({ method: "GET", body: null });
      await expect(res.status).toBe(404);
      await expect(res.json()).resolves.toStrictEqual({
        message: "Partner details not found",
      });
    },
  });
});

test("returns 200 and correct details on success when partner + id matches", async () => {
  await testApiHandler({
    appHandler,
    paramsPatcher: (params) => ({ ...params, userId: "1234" }),
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: UserType.PARTNER },
        expires: "",
      });

      const exampleDetails = {
        numberOfPatients: 10,
        organizationType: OrganizationType.NON_PROFIT,
      };

      // Mock return for partner details
      dbMock.partnerDetails.findUnique.mockResolvedValueOnce(
        exampleDetails as any
      );

      const res = await fetch({ method: "GET", body: null });
      await expect(res.status).toBe(200);
      await expect(res.json()).resolves.toStrictEqual({
        numberOfPatients: 10,
        organizationType: OrganizationType.NON_PROFIT,
      });
    },
  });
});

test("returns 200 and correct details on success when staff matches", async () => {
  await testApiHandler({
    appHandler,
    paramsPatcher: (params) => ({ ...params, userId: "1234" }),
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1111", type: UserType.STAFF },
        expires: "",
      });

      const exampleDetails = {
        numberOfPatients: 10,
        organizationType: OrganizationType.NON_PROFIT,
      };

      // Mock return for partner details
      dbMock.partnerDetails.findUnique.mockResolvedValueOnce(
        exampleDetails as any
      );

      const res = await fetch({ method: "GET", body: null });
      await expect(res.status).toBe(200);
      await expect(res.json()).resolves.toStrictEqual({
        numberOfPatients: 10,
        organizationType: OrganizationType.NON_PROFIT,
      });
    },
  });
});

describe("POST /api/partnerDetails/[userId]", () => {
  // No Valid Session (401)
  test("returns 401 when there is no valid session", async () => {
    authMock.mockReturnValueOnce(null); //no valid session

    const formData = new FormData();
    formData.append("numberOfPatients", "8");
    formData.append("organizationType", "NON_PROFIT");

    await testApiHandler({
      appHandler,
      params: { userId: "1" },
      async test({ fetch }) {
        const res = await fetch({
          method: "POST",
          body: formData,
        });

        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json).toEqual({ message: "Session required" });
      },
    });
  });

  // PARTNER user tries to modify another user's details (session user ID does not match the request user ID) (403)
  test("returns 403 when a PARTNER user tries to modify another user's record", async () => {
    authMock.mockReturnValueOnce({
      user: { id: "1", type: "PARTNER" },
      expires: "",
    });

    const formData = new FormData();
    formData.append("numberOfPatients", "8");
    formData.append("organizationType", "NON_PROFIT");

    await testApiHandler({
      appHandler,
      params: { userId: "2" }, //different user
      async test({ fetch }) {
        const res = await fetch({
          method: "POST",
          body: formData,
        });

        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json).toEqual({
          message: "You are not allowed to modify this record",
        });
      },
    });
  });

  // Invalid Form Data (400)
  test("returns 400 when the form data is invalid", async () => {
    authMock.mockReturnValueOnce({
      user: { id: "1", type: "SUPER_ADMIN" },
      expires: "",
    });

    // missing numberOfPatients
    const formData = new FormData();
    formData.append("organizationType", "NON_PROFIT");

    await testApiHandler({
      appHandler,
      params: { userId: "1" },
      async test({ fetch }) {
        const res = await fetch({
          method: "POST",
          body: formData,
        });

        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json).toEqual({ message: "Invalid form data" });
      },
    });
  });

  // Valid Request (200)
  test("updates PartnerDetails and returns 200 for a valid request", async () => {
    authMock.mockReturnValueOnce({
      user: { id: "1", type: "SUPER_ADMIN" },
      expires: "",
    });

    const updatedPartnerDetails = {
      numberOfPatients: 5,
      organizationType: "NON_PROFIT" as OrganizationType,
    };

    const updatedUser = {
      id: 1,
      email: "test_email",
      name: "test_name",
      passwordHash: "test_hash",
      type: UserType.SUPER_ADMIN,
      partnerDetails: updatedPartnerDetails
    }

    dbMock.user.update.mockResolvedValueOnce(updatedUser);

    const formData = new FormData();
    formData.append("numberOfPatients", "5");
    formData.append("organizationType", "NON_PROFIT");

    await testApiHandler({
      appHandler,
      params: { userId: "1" },
      async test({ fetch }) {
        const res = await fetch({
          method: "POST",
          body: formData,
        });

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toEqual(updatedPartnerDetails);
      },
    });
  });
});

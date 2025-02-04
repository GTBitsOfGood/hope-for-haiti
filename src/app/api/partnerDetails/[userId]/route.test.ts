import { testApiHandler } from "next-test-api-route-handler";
import { authMock } from "@/test/authMock";
import { dbMock } from "@/test/dbMock";
import { expect, test, describe } from "@jest/globals";
import { OrganizationType } from "@prisma/client";
import * as appHandler from "./route";

describe("POST /api/partnerDetails/[userId]", () => {
  beforeEach(() => {

  });

  //No Valid Session (401)
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

  //PARTNER user tries to modify another user's details (session user ID does not match the request user ID) (403)
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
        expect(json).toEqual({ message: "You are not allowed to modify this record" });
      },
    });
  });

  //Invalid Form Data (400)
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

  //Valid Request (200)
  test("updates PartnerDetails and returns 200 for a valid request", async () => {
    authMock.mockReturnValueOnce({
      user: { id: "1", type: "SUPER_ADMIN" },
      expires: "",
    });

    const existingPartnerDetails = {
      userId: 1,
      id: 1,
      numberOfPatients: 8,
      organizationType: "FOR_PROFIT" as OrganizationType,
    };
    dbMock.partnerDetails.findUnique.mockResolvedValueOnce(existingPartnerDetails);

    const updatedPartnerDetails = {
      ...existingPartnerDetails,
      numberOfPatients: 5,
      organizationType: "NON_PROFIT" as OrganizationType,
    };
    dbMock.partnerDetails.update.mockResolvedValueOnce(updatedPartnerDetails);

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

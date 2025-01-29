import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { expect, test } from "@jest/globals";
import { dbMock } from "@/test/dbMock";
import { authMock } from "@/test/authMock";

test("Updates partner details", async () => {
  await testApiHandler({
    appHandler,
    params: { userId: "1234" },
    async test({ fetch }) {
      // mock session as an admin user
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "ADMIN" },
        expires: "",
      });

      // mock existing PartnerDetails in the database
      dbMock.partnerDetails.findUnique.mockResolvedValue({
        id: 1,
        userId: 1234,
        numberOfPatients: 50,
        organizationType: "NON_PROFIT",
      });

      // mock updating PartnerDetails
      dbMock.partnerDetails.update.mockResolvedValue({
        id: 1,
        userId: 1234,
        numberOfPatients: 100,
        organizationType: "FOR_PROFIT",
      });

      // make request with JSON body instead of form data
      const res = await fetch({
        method: "POST",
        body: JSON.stringify({
          numberOfPatients: 100,
          organizationType: "FOR_PROFIT",
        }),
        headers: { "Content-Type": "application/json" },
      });

      // expect successful response
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toStrictEqual({
        id: 1,
        userId: 1234,
        numberOfPatients: 100,
        organizationType: "FOR_PROFIT",
      });
    },
  });
});

import { testApiHandler } from "next-test-api-route-handler";
import { expect, test } from "@jest/globals";
import { UserType } from "@prisma/client";
import * as uuid from "uuid";

import { dbMock } from "@/test/dbMock";
import { authMock } from "@/test/authMock";
import { sendEmailMock } from "@/test/emailMock";

import * as appHandler from "./route";

test("requires session", async () => {
  await testApiHandler({
    appHandler,

    async test({ fetch }) {
      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "ADMIN");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(401);
    },
  });
});

test("requires SUPER_ADMIN user type", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "ADMIN" },
        expires: "",
      });

      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "ADMIN");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(403);
    },
  });
});

test("email is validated correctly", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "SUPER_ADMIN" },
        expires: "",
      });

      const formData = new FormData();
      formData.append("email", "invalidemail");
      formData.append("userType", "ADMIN");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(400);
    },
  });
});

test("userType is validated correctly", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "SUPER_ADMIN" },
        expires: "",
      });

      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "INVALID_TYPE");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(400);
    },
  });
});

test("check existing user", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "SUPER_ADMIN" },
        expires: "",
      });

      dbMock.user.findFirst.mockResolvedValue({
        id: 1,
        email: "test@test.com",
        name: "name",
        type: UserType.ADMIN,
        passwordHash: "abc",
        partnerDetails: null,
      });

      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "ADMIN");
      formData.append("name", "test name");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(409);
    },
  });
});

test("test email html", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "SUPER_ADMIN" },
        expires: "",
      });

      sendEmailMock.mockImplementation(async () => {});

      const uuidMock = jest.spyOn(uuid, "v4");
      const mockToken = "mocked-uuid-token";
      // @ts-expect-error: jest cannot deal with overloaded functions
      uuidMock.mockReturnValueOnce(mockToken);

      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "ADMIN");
      formData.append("name", "test name");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(200);

      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.stringMatching(new RegExp(`register\\?token=${mockToken}`))
      );
    },
  });
});

test("UserInvite expires in one day", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "SUPER_ADMIN" },
        expires: "",
      });

      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "ADMIN");
      formData.append("name", "test name");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(200);

      const createdInvite = dbMock.userInvite.create.mock.calls[0][0].data;
      const expirationDate = new Date(createdInvite.expiration);
      const currentDate = new Date();
      const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

      expect(expirationDate.getTime() - currentDate.getTime()).toBeCloseTo(
        oneDayInMilliseconds,
        -2
      );
    },
  });
});

test("verify sendEmail call", async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      authMock.mockReturnValueOnce({
        user: { id: "1234", type: "SUPER_ADMIN" },
        expires: "",
      });

      sendEmailMock.mockImplementation(async () => {});

      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("userType", "ADMIN");
      formData.append("name", "test name");
      const res = await fetch({ method: "POST", body: formData });
      expect(res.status).toBe(200);

      expect(sendEmailMock).toHaveBeenCalled();
    },
  });
});

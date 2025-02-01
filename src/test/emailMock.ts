import { jest } from "@jest/globals";

const sendEmailMock = jest
  .fn()
  .mockImplementation(async () => Promise.resolve());

jest.mock("@/util/email", () => ({
  __esModule: true,
  sendEmail: sendEmailMock,
}));

export { sendEmailMock };

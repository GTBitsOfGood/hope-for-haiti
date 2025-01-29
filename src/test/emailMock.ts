import { jest } from "@jest/globals";
import open from "open-html";

const sendEmailMock = jest
  .fn()
  .mockImplementation(async (to, subject, html) => Promise.resolve());

jest.mock("@/util/email", () => ({
  __esModule: true,
  sendEmail: sendEmailMock,
}));

export { sendEmailMock };

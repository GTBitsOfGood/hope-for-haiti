import { sendEmail } from "@/util/email";
import { jest } from "@jest/globals";
import { mockReset } from "jest-mock-extended";

const sendEmailMock = jest.fn<typeof sendEmail>();

jest.mock("@/util/email", () => ({
  __esModule: true,
  sendEmail: sendEmailMock,
}));

beforeEach(() => {
  mockReset(sendEmailMock);
});

export { sendEmailMock };

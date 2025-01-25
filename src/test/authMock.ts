if (process.env.NODE_ENV !== "test")
  throw "authMock should only be imported in test environments";

import { jest, beforeEach } from "@jest/globals";
import { mockReset } from "jest-mock-extended";

import { auth } from "@/auth";
import { Session } from "next-auth";

jest.mock("@/auth");

beforeEach(() => {
  mockReset(authMock);
});

export const authMock = auth as unknown as jest.Mock<() => Session | null>;
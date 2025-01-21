if (process.env.NODE_ENV !== "test")
  throw "dbMock should only be imported in test environments";

import { jest, beforeEach } from "@jest/globals";
import { PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep, mockReset } from "jest-mock-extended";

import { db } from "@/db";

jest.mock("@/db", () => ({
  __esModule: true,
  db: mockDeep<typeof db>(),
}));

beforeEach(() => {
  mockReset(dbMock);
});

export const dbMock = db as unknown as DeepMockProxy<PrismaClient>;

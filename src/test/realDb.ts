if (process.env.NODE_ENV !== "test")
  throw "realDb should only be imported in test environments";

import { db } from "@/db";
import { afterEach, beforeEach } from "@jest/globals";

beforeEach(async () => {
  await db.$executeRawUnsafe("BEGIN;");
});

afterEach(async () => {
  await db.$executeRawUnsafe("ROLLBACK;");
});

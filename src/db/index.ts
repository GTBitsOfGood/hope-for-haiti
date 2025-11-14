// See https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { db: PrismaClient };

export const db =
  globalForPrisma.db ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// In serverless environments, explicitly disconnect after queries to prevent connection buildup
// Note: Prisma automatically reconnects when needed
if (process.env.NODE_ENV === "production") {
  // For serverless, we want to clean up connections but Prisma handles this automatically
  // Just ensure we're not keeping connections open unnecessarily
}

if (process.env.NODE_ENV !== "production") globalForPrisma.db = db;

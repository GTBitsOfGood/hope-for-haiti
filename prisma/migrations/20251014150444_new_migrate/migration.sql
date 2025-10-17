/*
  Warnings:

  - You are about to drop the column `allocationId` on the `LineItem` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "LineItem_allocationId_key";

-- AlterTable
ALTER TABLE "LineItem" DROP COLUMN "allocationId";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "enabled" SET DEFAULT false,
ALTER COLUMN "pending" SET DEFAULT true;

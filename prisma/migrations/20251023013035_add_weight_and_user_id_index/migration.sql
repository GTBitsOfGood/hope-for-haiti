/*
  Warnings:

  - Made the column `weight` on table `GeneralItem` required. This step will fail if there are existing NULL values in that column.

*/
UPDATE "GeneralItem" SET "weight" = 0 WHERE "weight" IS NULL;

-- AlterTable
ALTER TABLE "GeneralItem" ALTER COLUMN "weight" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

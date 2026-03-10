/*
  Warnings:

  - Made the column `dashboardTutorial` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `itemsTutorial` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `requestsTutorial` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `wishlistsTutorial` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "dashboardTutorial" SET NOT NULL,
ALTER COLUMN "itemsTutorial" SET NOT NULL,
ALTER COLUMN "requestsTutorial" SET NOT NULL,
ALTER COLUMN "wishlistsTutorial" SET NOT NULL;

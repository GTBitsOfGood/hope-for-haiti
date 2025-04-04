/*
  Warnings:

  - Made the column `quantity` on table `DonorOfferItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DonorOfferItem" ALTER COLUMN "quantity" SET NOT NULL;

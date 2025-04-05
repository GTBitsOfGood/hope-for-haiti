/*
  Warnings:

  - Added the required column `unitSize` to the `DonorOfferItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DonorOfferItem" ADD COLUMN     "unitSize" INTEGER NOT NULL;

/*
  Warnings:

  - You are about to drop the column `expiration` on the `DonorOfferItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DonorOfferItem" DROP COLUMN "expiration",
ADD COLUMN     "expirationDate" TIMESTAMP(3);

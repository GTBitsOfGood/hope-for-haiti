/*
  Warnings:

  - You are about to drop the column `unitSize` on the `DonorOfferItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DonorOfferItem" DROP COLUMN "unitSize",
ADD COLUMN     "unitType" TEXT;

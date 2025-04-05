/*
  Warnings:

  - Added the required column `partnerId` to the `DonorOfferItemRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DonorOfferItemRequest" ADD COLUMN     "partnerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "DonorOfferItemRequest" ADD CONSTRAINT "DonorOfferItemRequest_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

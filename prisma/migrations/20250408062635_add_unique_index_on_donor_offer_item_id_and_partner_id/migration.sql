/*
  Warnings:

  - A unique constraint covering the columns `[donorOfferItemId,partnerId]` on the table `DonorOfferItemRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DonorOfferItemRequest_donorOfferItemId_partnerId_key" ON "DonorOfferItemRequest"("donorOfferItemId", "partnerId");

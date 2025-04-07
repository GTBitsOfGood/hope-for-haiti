/*
  Warnings:

  - A unique constraint covering the columns `[donorOfferId,title,type,expirationDate,unitType,quantityPerUnit]` on the table `DonorOfferItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DonorOfferItem_donorOfferId_title_type_expirationDate_unitT_key" ON "DonorOfferItem"("donorOfferId", "title", "type", "expirationDate", "unitType", "quantityPerUnit");

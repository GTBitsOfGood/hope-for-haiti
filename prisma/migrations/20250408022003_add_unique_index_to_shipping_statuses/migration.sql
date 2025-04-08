/*
  Warnings:

  - A unique constraint covering the columns `[donorShippingNumber,hfhShippingNumber]` on the table `ShippingStatus` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ShippingStatus_donorShippingNumber_hfhShippingNumber_key" ON "ShippingStatus"("donorShippingNumber", "hfhShippingNumber");

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "donorOfferItemId" INTEGER;

-- CreateTable
CREATE TABLE "DonorOfferItemRequestAllocation" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "donorOfferItemRequestId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "DonorOfferItemRequestAllocation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_donorOfferItemId_fkey" FOREIGN KEY ("donorOfferItemId") REFERENCES "DonorOfferItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorOfferItemRequestAllocation" ADD CONSTRAINT "DonorOfferItemRequestAllocation_donorOfferItemRequestId_fkey" FOREIGN KEY ("donorOfferItemRequestId") REFERENCES "DonorOfferItemRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorOfferItemRequestAllocation" ADD CONSTRAINT "DonorOfferItemRequestAllocation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

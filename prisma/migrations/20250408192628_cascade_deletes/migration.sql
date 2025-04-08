-- DropForeignKey
ALTER TABLE "Distribution" DROP CONSTRAINT "Distribution_donorOfferItemRequestAllocationId_fkey";

-- DropForeignKey
ALTER TABLE "Distribution" DROP CONSTRAINT "Distribution_signOffId_fkey";

-- DropForeignKey
ALTER TABLE "Distribution" DROP CONSTRAINT "Distribution_unallocatedItemRequestAllocationId_fkey";

-- DropForeignKey
ALTER TABLE "DonorOfferItem" DROP CONSTRAINT "DonorOfferItem_donorOfferId_fkey";

-- DropForeignKey
ALTER TABLE "DonorOfferItemRequest" DROP CONSTRAINT "DonorOfferItemRequest_donorOfferItemId_fkey";

-- DropForeignKey
ALTER TABLE "DonorOfferItemRequest" DROP CONSTRAINT "DonorOfferItemRequest_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "DonorOfferItemRequestAllocation" DROP CONSTRAINT "DonorOfferItemRequestAllocation_donorOfferItemRequestId_fkey";

-- DropForeignKey
ALTER TABLE "DonorOfferItemRequestAllocation" DROP CONSTRAINT "DonorOfferItemRequestAllocation_itemId_fkey";

-- DropForeignKey
ALTER TABLE "DonorOfferPartnerVisibility" DROP CONSTRAINT "DonorOfferPartnerVisibility_donorOfferId_fkey";

-- DropForeignKey
ALTER TABLE "DonorOfferPartnerVisibility" DROP CONSTRAINT "DonorOfferPartnerVisibility_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_donorOfferItemId_fkey";

-- DropForeignKey
ALTER TABLE "SignOff" DROP CONSTRAINT "SignOff_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "UnallocatedItemRequestAllocation" DROP CONSTRAINT "UnallocatedItemRequestAllocation_itemId_fkey";

-- DropForeignKey
ALTER TABLE "UnallocatedItemRequestAllocation" DROP CONSTRAINT "UnallocatedItemRequestAllocation_unallocatedItemRequestId_fkey";

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_donorOfferItemId_fkey" FOREIGN KEY ("donorOfferItemId") REFERENCES "DonorOfferItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnallocatedItemRequestAllocation" ADD CONSTRAINT "UnallocatedItemRequestAllocation_unallocatedItemRequestId_fkey" FOREIGN KEY ("unallocatedItemRequestId") REFERENCES "UnallocatedItemRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnallocatedItemRequestAllocation" ADD CONSTRAINT "UnallocatedItemRequestAllocation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorOfferItem" ADD CONSTRAINT "DonorOfferItem_donorOfferId_fkey" FOREIGN KEY ("donorOfferId") REFERENCES "DonorOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorOfferItemRequest" ADD CONSTRAINT "DonorOfferItemRequest_donorOfferItemId_fkey" FOREIGN KEY ("donorOfferItemId") REFERENCES "DonorOfferItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorOfferItemRequest" ADD CONSTRAINT "DonorOfferItemRequest_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorOfferPartnerVisibility" ADD CONSTRAINT "DonorOfferPartnerVisibility_donorOfferId_fkey" FOREIGN KEY ("donorOfferId") REFERENCES "DonorOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorOfferPartnerVisibility" ADD CONSTRAINT "DonorOfferPartnerVisibility_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorOfferItemRequestAllocation" ADD CONSTRAINT "DonorOfferItemRequestAllocation_donorOfferItemRequestId_fkey" FOREIGN KEY ("donorOfferItemRequestId") REFERENCES "DonorOfferItemRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorOfferItemRequestAllocation" ADD CONSTRAINT "DonorOfferItemRequestAllocation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_unallocatedItemRequestAllocationId_fkey" FOREIGN KEY ("unallocatedItemRequestAllocationId") REFERENCES "UnallocatedItemRequestAllocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_donorOfferItemRequestAllocationId_fkey" FOREIGN KEY ("donorOfferItemRequestAllocationId") REFERENCES "DonorOfferItemRequestAllocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_signOffId_fkey" FOREIGN KEY ("signOffId") REFERENCES "SignOff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignOff" ADD CONSTRAINT "SignOff_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

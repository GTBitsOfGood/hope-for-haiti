-- AlterTable
ALTER TABLE "DonorOfferItemRequestAllocation" ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UnallocatedItemRequestAllocation" ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT false;

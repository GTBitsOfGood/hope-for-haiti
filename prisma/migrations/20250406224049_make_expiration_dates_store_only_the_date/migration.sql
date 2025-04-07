-- AlterTable
ALTER TABLE "DonorOfferItem" ALTER COLUMN "expirationDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "Item" ALTER COLUMN "expirationDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "UnallocatedItemRequest" ALTER COLUMN "expirationDate" SET DATA TYPE DATE;

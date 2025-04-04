-- AlterTable
ALTER TABLE "DonorOfferItem" ADD COLUMN     "quantityPerUnit" TEXT,
ALTER COLUMN "quantity" DROP NOT NULL;

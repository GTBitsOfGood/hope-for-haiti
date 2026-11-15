-- AlterTable
ALTER TABLE "DonorOffer" ADD COLUMN     "savedTotal" MONEY;

-- AlterTable
ALTER TABLE "LineItem" ADD COLUMN     "priceSetOn" TIMESTAMP(3),
ADD COLUMN     "savedUnitPrice" MONEY;

-- AlterTable
ALTER TABLE "Distribution" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ShippingStatus" ALTER COLUMN "donorShippingNumber" DROP NOT NULL,
ALTER COLUMN "hfhShippingNumber" DROP NOT NULL;

/*
  Warnings:

  - Added the required column `allowAllocations` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gik` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priority` to the `UnallocatedItemRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "allowAllocations" BOOLEAN NOT NULL,
ADD COLUMN     "donorShippingNumber" TEXT,
ADD COLUMN     "gik" BOOLEAN NOT NULL,
ADD COLUMN     "hfhShippingNumber" TEXT,
ADD COLUMN     "quantityPerUnit" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "unitType" DROP NOT NULL,
ALTER COLUMN "datePosted" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "maxRequestLimit" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UnallocatedItemRequest" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "priority" "RequestPriority" NOT NULL;

-- CreateTable
CREATE TABLE "UnallocatedItemRequestAllocation" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unallocatedItemRequestId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "UnallocatedItemRequestAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorOffer" (
    "id" SERIAL NOT NULL,
    "offerName" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "responseDeadline" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonorOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorOfferItem" (
    "id" SERIAL NOT NULL,
    "donorOfferId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiration" TIMESTAMP(3),
    "quantity" INTEGER NOT NULL,
    "unitSize" TEXT NOT NULL,

    CONSTRAINT "DonorOfferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorOfferItemRequest" (
    "id" SERIAL NOT NULL,
    "donorOfferItemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "comments" TEXT NOT NULL,
    "priority" "RequestPriority" NOT NULL,

    CONSTRAINT "DonorOfferItemRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UnallocatedItemRequestAllocation" ADD CONSTRAINT "UnallocatedItemRequestAllocation_unallocatedItemRequestId_fkey" FOREIGN KEY ("unallocatedItemRequestId") REFERENCES "UnallocatedItemRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnallocatedItemRequestAllocation" ADD CONSTRAINT "UnallocatedItemRequestAllocation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorOfferItem" ADD CONSTRAINT "DonorOfferItem_donorOfferId_fkey" FOREIGN KEY ("donorOfferId") REFERENCES "DonorOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorOfferItemRequest" ADD CONSTRAINT "DonorOfferItemRequest_donorOfferItemId_fkey" FOREIGN KEY ("donorOfferItemId") REFERENCES "DonorOfferItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

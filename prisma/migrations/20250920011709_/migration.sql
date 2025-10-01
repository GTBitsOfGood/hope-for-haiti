/*
  Warnings:

  - You are about to drop the column `actualQuantity` on the `Distribution` table. All the data in the column will be lost.
  - You are about to drop the column `donorOfferItemRequestAllocationId` on the `Distribution` table. All the data in the column will be lost.
  - You are about to drop the column `signOffId` on the `Distribution` table. All the data in the column will be lost.
  - You are about to drop the column `unallocatedItemRequestAllocationId` on the `Distribution` table. All the data in the column will be lost.
  - You are about to drop the column `partnerId` on the `SignOff` table. All the data in the column will be lost.
  - You are about to drop the `DonorOfferItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DonorOfferItemRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DonorOfferItemRequestAllocation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DonorOfferPartnerVisibility` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UnallocatedItemRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UnallocatedItemRequestAllocation` table. If the table is not empty, all the data it contains will be lost.

*/
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
ALTER TABLE "UnallocatedItemRequest" DROP CONSTRAINT "UnallocatedItemRequest_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "UnallocatedItemRequestAllocation" DROP CONSTRAINT "UnallocatedItemRequestAllocation_itemId_fkey";

-- DropForeignKey
ALTER TABLE "UnallocatedItemRequestAllocation" DROP CONSTRAINT "UnallocatedItemRequestAllocation_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "UnallocatedItemRequestAllocation" DROP CONSTRAINT "UnallocatedItemRequestAllocation_unallocatedItemRequestId_fkey";

-- DropIndex
DROP INDEX "Distribution_donorOfferItemRequestAllocationId_key";

-- DropIndex
DROP INDEX "Distribution_unallocatedItemRequestAllocationId_key";

-- AlterTable
ALTER TABLE "Distribution" DROP COLUMN "actualQuantity",
DROP COLUMN "donorOfferItemRequestAllocationId",
DROP COLUMN "signOffId",
DROP COLUMN "unallocatedItemRequestAllocationId",
ADD COLUMN     "pending" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SignOff" DROP COLUMN "partnerId";

-- DropTable
DROP TABLE "DonorOfferItem";

-- DropTable
DROP TABLE "DonorOfferItemRequest";

-- DropTable
DROP TABLE "DonorOfferItemRequestAllocation";

-- DropTable
DROP TABLE "DonorOfferPartnerVisibility";

-- DropTable
DROP TABLE "Item";

-- DropTable
DROP TABLE "UnallocatedItemRequest";

-- DropTable
DROP TABLE "UnallocatedItemRequestAllocation";

-- CreateTable
CREATE TABLE "LineItem" (
    "id" SERIAL NOT NULL,
    "category" "ItemCategory" NOT NULL,
    "donorName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "palletNumber" TEXT NOT NULL,
    "boxNumber" TEXT NOT NULL,
    "unitPrice" MONEY NOT NULL,
    "maxRequestLimit" TEXT,
    "donorShippingNumber" TEXT,
    "hfhShippingNumber" TEXT,
    "datePosted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ndc" TEXT,
    "notes" TEXT,
    "allowAllocations" BOOLEAN NOT NULL,
    "visible" BOOLEAN NOT NULL,
    "gik" BOOLEAN NOT NULL,
    "generalItemId" INTEGER,
    "allocationId" INTEGER,

    CONSTRAINT "LineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" SERIAL NOT NULL,
    "partnerId" INTEGER,
    "lineItemId" INTEGER NOT NULL,
    "distributionId" INTEGER NOT NULL,
    "signOffId" INTEGER,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneralItem" (
    "id" SERIAL NOT NULL,
    "donorOfferId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expirationDate" DATE,
    "unitType" TEXT NOT NULL,
    "quantityPerUnit" INTEGER NOT NULL,
    "initialQuantity" INTEGER NOT NULL,
    "requestQuantity" INTEGER,

    CONSTRAINT "GeneralItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneralItemRequest" (
    "id" SERIAL NOT NULL,
    "generalItemId" INTEGER NOT NULL,
    "partnerId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "comments" TEXT,
    "priority" "RequestPriority",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneralItemRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DonorOfferToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DonorOfferToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "LineItem_allocationId_key" ON "LineItem"("allocationId");

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_lineItemId_key" ON "Allocation"("lineItemId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralItem_donorOfferId_title_type_expirationDate_unitType_key" ON "GeneralItem"("donorOfferId", "title", "type", "expirationDate", "unitType", "quantityPerUnit");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralItemRequest_generalItemId_partnerId_key" ON "GeneralItemRequest"("generalItemId", "partnerId");

-- CreateIndex
CREATE INDEX "_DonorOfferToUser_B_index" ON "_DonorOfferToUser"("B");

-- AddForeignKey
ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_generalItemId_fkey" FOREIGN KEY ("generalItemId") REFERENCES "GeneralItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "LineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "Distribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_signOffId_fkey" FOREIGN KEY ("signOffId") REFERENCES "SignOff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralItem" ADD CONSTRAINT "GeneralItem_donorOfferId_fkey" FOREIGN KEY ("donorOfferId") REFERENCES "DonorOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralItemRequest" ADD CONSTRAINT "GeneralItemRequest_generalItemId_fkey" FOREIGN KEY ("generalItemId") REFERENCES "GeneralItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralItemRequest" ADD CONSTRAINT "GeneralItemRequest_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DonorOfferToUser" ADD CONSTRAINT "_DonorOfferToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "DonorOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DonorOfferToUser" ADD CONSTRAINT "_DonorOfferToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('WAITING_ARRIVAL_FROM_DONOR', 'LOAD_ON_SHIP_AIR', 'CLEARED_CUSTOMS', 'READY_FOR_DISTRIBUTION');

-- CreateTable
CREATE TABLE "Distribution" (
    "id" SERIAL NOT NULL,
    "partnerId" INTEGER NOT NULL,
    "unallocatedItemRequestAllocationId" INTEGER,
    "donorOfferItemRequestAllocationId" INTEGER,
    "signOffId" INTEGER NOT NULL,

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingStatus" (
    "id" SERIAL NOT NULL,
    "donorShippingNumber" TEXT NOT NULL,
    "hfhShippingNumber" TEXT NOT NULL,
    "value" "ShipmentStatus" NOT NULL,

    CONSTRAINT "ShippingStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignOff" (
    "id" SERIAL NOT NULL,
    "staffMemberName" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "signatureUrl" TEXT NOT NULL,

    CONSTRAINT "SignOff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Distribution_unallocatedItemRequestAllocationId_key" ON "Distribution"("unallocatedItemRequestAllocationId");

-- CreateIndex
CREATE UNIQUE INDEX "Distribution_donorOfferItemRequestAllocationId_key" ON "Distribution"("donorOfferItemRequestAllocationId");

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_unallocatedItemRequestAllocationId_fkey" FOREIGN KEY ("unallocatedItemRequestAllocationId") REFERENCES "UnallocatedItemRequestAllocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_donorOfferItemRequestAllocationId_fkey" FOREIGN KEY ("donorOfferItemRequestAllocationId") REFERENCES "DonorOfferItemRequestAllocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_signOffId_fkey" FOREIGN KEY ("signOffId") REFERENCES "SignOff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - Added the required column `state` to the `DonorOffer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DonorOfferState" AS ENUM ('UNFINALIZED', 'FINALIZED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "DonorOffer" ADD COLUMN     "state" "DonorOfferState" NOT NULL;

-- CreateTable
CREATE TABLE "DonorOfferPartnerVisibility" (
    "id" SERIAL NOT NULL,
    "donorOfferId" INTEGER NOT NULL,
    "partnerId" INTEGER NOT NULL,

    CONSTRAINT "DonorOfferPartnerVisibility_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DonorOfferPartnerVisibility" ADD CONSTRAINT "DonorOfferPartnerVisibility_donorOfferId_fkey" FOREIGN KEY ("donorOfferId") REFERENCES "DonorOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorOfferPartnerVisibility" ADD CONSTRAINT "DonorOfferPartnerVisibility_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

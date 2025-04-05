/*
  Warnings:

  - You are about to drop the column `responseDeadline` on the `DonorOffer` table. All the data in the column will be lost.
  - Added the required column `donorResponseDeadline` to the `DonorOffer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partnerResponseDeadline` to the `DonorOffer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DonorOffer" DROP COLUMN "responseDeadline",
ADD COLUMN     "donorResponseDeadline" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "partnerResponseDeadline" TIMESTAMP(3) NOT NULL;

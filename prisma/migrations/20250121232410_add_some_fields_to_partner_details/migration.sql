/*
  Warnings:

  - Added the required column `numberOfPatients` to the `PartnerDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationType` to the `PartnerDetails` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('NON_PROFIT', 'FOR_PROFIT', 'RELIGIOUS');

-- AlterTable
ALTER TABLE "PartnerDetails" ADD COLUMN     "numberOfPatients" INTEGER NOT NULL,
ADD COLUMN     "organizationType" "OrganizationType" NOT NULL;

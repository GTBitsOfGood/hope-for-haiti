/*
  Warnings:

  - You are about to drop the `PartnerDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RequestedUnclaimedItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UnclaimedItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UnclaimedItemRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RequestedUnclaimedItem" DROP CONSTRAINT "RequestedUnclaimedItem_itemId_fkey";

-- DropForeignKey
ALTER TABLE "RequestedUnclaimedItem" DROP CONSTRAINT "RequestedUnclaimedItem_requestId_fkey";

-- DropForeignKey
ALTER TABLE "UnclaimedItemRequest" DROP CONSTRAINT "UnclaimedItemRequest_partnerId_fkey";

-- DropTable
DROP TABLE "PartnerDetails";

-- DropTable
DROP TABLE "RequestedUnclaimedItem";

-- DropTable
DROP TABLE "UnclaimedItem";

-- DropTable
DROP TABLE "UnclaimedItemRequest";

-- DropEnum
DROP TYPE "OrganizationType";

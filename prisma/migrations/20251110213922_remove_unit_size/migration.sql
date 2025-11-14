/*
  Warnings:

  - You are about to drop the column `unitSize` on the `Wishlist` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Wishlist" DROP COLUMN "unitSize",
ALTER COLUMN "quantity" DROP NOT NULL;

/*
  Warnings:

  - You are about to drop the column `comment` on the `Wishlist` table. All the data in the column will be lost.
  - Added the required column `comments` to the `Wishlist` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Wishlist" DROP COLUMN "comment",
ADD COLUMN     "comments" TEXT NOT NULL;

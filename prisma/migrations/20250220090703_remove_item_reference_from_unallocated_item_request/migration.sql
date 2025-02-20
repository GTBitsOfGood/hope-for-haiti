/*
  Warnings:

  - You are about to drop the column `itemId` on the `UnallocatedItemRequest` table. All the data in the column will be lost.
  - Added the required column `category` to the `UnallocatedItemRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `UnallocatedItemRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitSize` to the `UnallocatedItemRequest` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UnallocatedItemRequest" DROP CONSTRAINT "UnallocatedItemRequest_itemId_fkey";

-- AlterTable
ALTER TABLE "UnallocatedItemRequest" DROP COLUMN "itemId",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "expirationDate" TIMESTAMP(3),
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "unitSize" INTEGER NOT NULL;

/*
  Warnings:

  - You are about to drop the column `category` on the `UnallocatedItemRequest` table. All the data in the column will be lost.
  - Added the required column `type` to the `UnallocatedItemRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UnallocatedItemRequest" DROP COLUMN "category",
ADD COLUMN     "type" TEXT NOT NULL;

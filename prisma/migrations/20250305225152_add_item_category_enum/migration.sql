/*
  Warnings:

  - Changed the type of `category` on the `Item` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('MEDICATION', 'MEDICAL_SUPPLY', 'NON_MEDICAL', 'PURCHASES');

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "category",
ADD COLUMN     "category" "ItemCategory" NOT NULL;

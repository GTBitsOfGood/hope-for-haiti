/*
  Warnings:

  - Added the required column `boxNumber` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `palletNumber` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `unitPrice` on the `Item` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "boxNumber" INTEGER NOT NULL,
ADD COLUMN     "palletNumber" INTEGER NOT NULL,
DROP COLUMN "unitPrice",
ADD COLUMN     "unitPrice" MONEY NOT NULL;

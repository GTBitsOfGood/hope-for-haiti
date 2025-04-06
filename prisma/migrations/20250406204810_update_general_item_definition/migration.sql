/*
  Warnings:

  - You are about to drop the column `unitSize` on the `DonorOfferItem` table. All the data in the column will be lost.
  - You are about to drop the column `unitSize` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `unitSize` on the `UnallocatedItemRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DonorOfferItem" DROP COLUMN "unitSize";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "unitSize";

-- AlterTable
ALTER TABLE "UnallocatedItemRequest" DROP COLUMN "unitSize";

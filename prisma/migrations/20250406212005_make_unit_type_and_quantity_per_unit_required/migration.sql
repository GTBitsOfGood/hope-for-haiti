/*
  Warnings:

  - Added the required column `quantityPerUnit` to the `DonorOfferItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `unitType` on table `DonorOfferItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `unitType` on table `Item` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `quantityPerUnit` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantityPerUnit` to the `UnallocatedItemRequest` table without a default value. This is not possible if the table is not empty.
  - Made the column `unitType` on table `UnallocatedItemRequest` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DonorOfferItem" DROP COLUMN "quantityPerUnit",
ADD COLUMN     "quantityPerUnit" INTEGER NOT NULL,
ALTER COLUMN "unitType" SET NOT NULL;

-- AlterTable
ALTER TABLE "Item" ALTER COLUMN "unitType" SET NOT NULL,
DROP COLUMN "quantityPerUnit",
ADD COLUMN     "quantityPerUnit" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "UnallocatedItemRequest" DROP COLUMN "quantityPerUnit",
ADD COLUMN     "quantityPerUnit" INTEGER NOT NULL,
ALTER COLUMN "unitType" SET NOT NULL;

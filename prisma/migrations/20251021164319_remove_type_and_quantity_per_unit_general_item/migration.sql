/*
  Warnings:

  - You are about to drop the column `quantityPerUnit` on the `GeneralItem` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `GeneralItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[donorOfferId,title,expirationDate,unitType]` on the table `GeneralItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "GeneralItem_donorOfferId_title_type_expirationDate_unitType_key";

-- AlterTable
ALTER TABLE "GeneralItem" DROP COLUMN "quantityPerUnit",
DROP COLUMN "type";

-- CreateIndex
CREATE UNIQUE INDEX "GeneralItem_donorOfferId_title_expirationDate_unitType_key" ON "GeneralItem"("donorOfferId", "title", "expirationDate", "unitType");

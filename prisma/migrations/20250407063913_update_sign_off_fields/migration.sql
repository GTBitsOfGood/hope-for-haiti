/*
  Warnings:

  - Added the required column `actualQuantity` to the `Distribution` table without a default value. This is not possible if the table is not empty.
  - Made the column `signOffId` on table `Distribution` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Distribution" DROP CONSTRAINT "Distribution_signOffId_fkey";

-- AlterTable
ALTER TABLE "Distribution" ADD COLUMN     "actualQuantity" INTEGER NOT NULL,
ALTER COLUMN "signOffId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SignOff" ALTER COLUMN "signatureUrl" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_signOffId_fkey" FOREIGN KEY ("signOffId") REFERENCES "SignOff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

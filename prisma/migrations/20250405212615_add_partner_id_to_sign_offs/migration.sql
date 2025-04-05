/*
  Warnings:

  - Added the required column `partnerId` to the `SignOff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SignOff" ADD COLUMN     "partnerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "SignOff" ADD CONSTRAINT "SignOff_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

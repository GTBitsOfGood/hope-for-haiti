/*
  Warnings:

  - Added the required column `partnerId` to the `SignOff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SignOff" ADD COLUMN     "partnerId" INTEGER NOT NULL;

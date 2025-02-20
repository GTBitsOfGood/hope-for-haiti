/*
  Warnings:

  - Added the required column `visible` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "visible" BOOLEAN NOT NULL;

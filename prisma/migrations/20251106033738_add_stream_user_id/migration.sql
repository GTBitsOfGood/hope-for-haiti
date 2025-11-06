/*
  Warnings:

  - A unique constraint covering the columns `[streamUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "streamUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_streamUserId_key" ON "User"("streamUserId");

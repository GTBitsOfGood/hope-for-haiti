/*
  Warnings:

  - You are about to drop the column `email` on the `UserInvite` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `UserInvite` table. All the data in the column will be lost.
  - You are about to drop the column `partnerDetails` on the `UserInvite` table. All the data in the column will be lost.
  - You are about to drop the column `userType` on the `UserInvite` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `UserInvite` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `UserInvite` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "UserInvite_email_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pending" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserInvite" DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "partnerDetails",
DROP COLUMN "userType",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserInvite_userId_key" ON "UserInvite"("userId");

-- AddForeignKey
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

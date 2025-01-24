/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `UserInvite` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userType` to the `UserInvite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserInvite" ADD COLUMN     "userType" "UserType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserInvite_email_key" ON "UserInvite"("email");

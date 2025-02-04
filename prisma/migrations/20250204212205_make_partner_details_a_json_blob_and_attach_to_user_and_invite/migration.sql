-- DropForeignKey
ALTER TABLE "PartnerDetails" DROP CONSTRAINT "PartnerDetails_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "partnerDetails" JSONB;

-- AlterTable
ALTER TABLE "UserInvite" ADD COLUMN     "partnerDetails" JSONB;

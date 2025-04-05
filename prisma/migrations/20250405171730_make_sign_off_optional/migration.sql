-- DropForeignKey
ALTER TABLE "Distribution" DROP CONSTRAINT "Distribution_signOffId_fkey";

-- AlterTable
ALTER TABLE "Distribution" ALTER COLUMN "signOffId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_signOffId_fkey" FOREIGN KEY ("signOffId") REFERENCES "SignOff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

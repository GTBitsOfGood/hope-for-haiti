-- AlterTable
ALTER TABLE "UnallocatedItemRequestAllocation" ADD COLUMN     "partnerId" INTEGER;

-- AddForeignKey
ALTER TABLE "UnallocatedItemRequestAllocation" ADD CONSTRAINT "UnallocatedItemRequestAllocation_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

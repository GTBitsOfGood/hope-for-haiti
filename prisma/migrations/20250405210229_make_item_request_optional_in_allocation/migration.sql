-- DropForeignKey
ALTER TABLE "UnallocatedItemRequestAllocation" DROP CONSTRAINT "UnallocatedItemRequestAllocation_unallocatedItemRequestId_fkey";

-- AlterTable
ALTER TABLE "UnallocatedItemRequestAllocation" ALTER COLUMN "unallocatedItemRequestId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UnallocatedItemRequestAllocation" ADD CONSTRAINT "UnallocatedItemRequestAllocation_unallocatedItemRequestId_fkey" FOREIGN KEY ("unallocatedItemRequestId") REFERENCES "UnallocatedItemRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "RequestedUnclaimedItem" DROP CONSTRAINT "RequestedUnclaimedItem_itemId_fkey";

-- DropForeignKey
ALTER TABLE "RequestedUnclaimedItem" DROP CONSTRAINT "RequestedUnclaimedItem_requestId_fkey";

-- DropForeignKey
ALTER TABLE "UnallocatedItemRequest" DROP CONSTRAINT "UnallocatedItemRequest_itemId_fkey";

-- DropForeignKey
ALTER TABLE "UnallocatedItemRequest" DROP CONSTRAINT "UnallocatedItemRequest_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "UnclaimedItemRequest" DROP CONSTRAINT "UnclaimedItemRequest_partnerId_fkey";

-- AddForeignKey
ALTER TABLE "UnallocatedItemRequest" ADD CONSTRAINT "UnallocatedItemRequest_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnallocatedItemRequest" ADD CONSTRAINT "UnallocatedItemRequest_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnclaimedItemRequest" ADD CONSTRAINT "UnclaimedItemRequest_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestedUnclaimedItem" ADD CONSTRAINT "RequestedUnclaimedItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "UnclaimedItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestedUnclaimedItem" ADD CONSTRAINT "RequestedUnclaimedItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "UnclaimedItemRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Wishlist" ADD COLUMN     "generalItemId" INTEGER;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_generalItemId_fkey" FOREIGN KEY ("generalItemId") REFERENCES "GeneralItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

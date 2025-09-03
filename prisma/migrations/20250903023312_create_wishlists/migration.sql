-- CreateTable
CREATE TABLE "Wishlist" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unitSize" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priority" "RequestPriority" NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "comment" TEXT NOT NULL,
    "partnerId" INTEGER NOT NULL,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

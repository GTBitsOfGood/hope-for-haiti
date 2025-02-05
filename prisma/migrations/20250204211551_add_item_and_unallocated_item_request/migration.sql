-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "unitSize" INTEGER NOT NULL,
    "unitType" TEXT NOT NULL,
    "datePosted" TIMESTAMP(3) NOT NULL,
    "lotNumber" INTEGER NOT NULL,
    "donorName" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "maxRequestLimit" TEXT NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnallocatedItemRequest" (
    "id" SERIAL NOT NULL,
    "partnerId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "comments" TEXT NOT NULL,

    CONSTRAINT "UnallocatedItemRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UnallocatedItemRequest" ADD CONSTRAINT "UnallocatedItemRequest_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnallocatedItemRequest" ADD CONSTRAINT "UnallocatedItemRequest_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

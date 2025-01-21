-- CreateTable
CREATE TABLE "UserInvite" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnclaimedItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expirationDate" TIMESTAMP(3),

    CONSTRAINT "UnclaimedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnclaimedItemRequest" (
    "id" SERIAL NOT NULL,
    "partnerId" INTEGER NOT NULL,

    CONSTRAINT "UnclaimedItemRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestedUnclaimedItem" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "requestId" INTEGER NOT NULL,

    CONSTRAINT "RequestedUnclaimedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserInvite_token_key" ON "UserInvite"("token");

-- AddForeignKey
ALTER TABLE "UnclaimedItemRequest" ADD CONSTRAINT "UnclaimedItemRequest_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestedUnclaimedItem" ADD CONSTRAINT "RequestedUnclaimedItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "UnclaimedItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestedUnclaimedItem" ADD CONSTRAINT "RequestedUnclaimedItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "UnclaimedItemRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

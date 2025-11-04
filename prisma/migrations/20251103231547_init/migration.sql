CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'STAFF', 'PARTNER');

-- CreateEnum
CREATE TYPE "DonorOfferState" AS ENUM ('UNFINALIZED', 'FINALIZED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('WAITING_ARRIVAL_FROM_DONOR', 'LOAD_ON_SHIP_AIR', 'ARRIVED_IN_HAITI', 'CLEARED_CUSTOMS', 'ARRIVED_AT_DEPO', 'INVENTORIES', 'READY_FOR_DISTRIBUTION');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('MEDICATION', 'MEDICATION_SUPPLEMENT', 'NON_MEDICATION');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('NEEDLES_SYRINGES', 'ALZHEIMERS', 'ANTIBIOTIC', 'ANTIFUNGAL', 'ANTIVIRAL', 'BOOKS', 'CANCER', 'CARDIOVASCULAR', 'CLOTHING_ACCESSORIES', 'DENTAL', 'DERMATOLOGY', 'DEWORMER', 'DIABETES', 'EMERGENCY_RELIEF', 'ENT', 'FACILITY', 'FLUID_REPLENISHMENT', 'GASTROENTEROLOGY', 'GENERAL', 'HIV', 'HORMONES', 'HYGIENE', 'LAB', 'NEUROLOGICAL', 'NUTRITION_SUPPLEMENTS', 'OB_GYN', 'OFFICE_SUPPLIES', 'OPHTHALMOLOGY', 'ORTHO', 'PAIN_RELIEVERS', 'PEDIATRIC', 'PPE', 'PSYCHIATRIC', 'RECREATION', 'RESPIRATORY', 'STEROID', 'SURGICAL', 'THYROID', 'URINARY_BOWEL', 'VACCINES', 'WASH', 'WOUND_CARE', 'X_RAY');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "type" "UserType" NOT NULL,
    "tag" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "pending" BOOLEAN NOT NULL DEFAULT true,
    "partnerDetails" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInvite" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "UserInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorOffer" (
    "id" SERIAL NOT NULL,
    "state" "DonorOfferState" NOT NULL,
    "offerName" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "partnerResponseDeadline" TIMESTAMP(3) NOT NULL,
    "donorResponseDeadline" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "DonorOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneralItem" (
    "id" SERIAL NOT NULL,
    "donorOfferId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "expirationDate" DATE,
    "unitType" TEXT NOT NULL,
    "initialQuantity" INTEGER NOT NULL,
    "requestQuantity" INTEGER,
    "description" TEXT,
    "type" "ItemType",
    "category" "ItemCategory",
    "weight" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "GeneralItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineItem" (
    "id" SERIAL NOT NULL,
    "donorName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "palletNumber" TEXT NOT NULL,
    "boxNumber" TEXT NOT NULL,
    "unitPrice" MONEY NOT NULL,
    "maxRequestLimit" TEXT,
    "donorShippingNumber" TEXT,
    "hfhShippingNumber" TEXT,
    "datePosted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ndc" TEXT,
    "notes" TEXT,
    "allowAllocations" BOOLEAN NOT NULL,
    "visible" BOOLEAN NOT NULL,
    "gik" BOOLEAN NOT NULL,
    "generalItemId" INTEGER,

    CONSTRAINT "LineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemEmbeddings" (
    "id" SERIAL NOT NULL,
    "generalItemId" INTEGER,
    "wishlistId" INTEGER,
    "donorOfferId" INTEGER,
    "embedding" vector NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemEmbeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneralItemRequest" (
    "id" SERIAL NOT NULL,
    "generalItemId" INTEGER NOT NULL,
    "partnerId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "finalQuantity" INTEGER NOT NULL DEFAULT 0,
    "comments" TEXT,
    "priority" "RequestPriority",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneralItemRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" SERIAL NOT NULL,
    "partnerId" INTEGER,
    "lineItemId" INTEGER NOT NULL,
    "distributionId" INTEGER NOT NULL,
    "signOffId" INTEGER,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distribution" (
    "id" SERIAL NOT NULL,
    "partnerId" INTEGER NOT NULL,
    "pending" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignOff" (
    "id" SERIAL NOT NULL,
    "staffMemberName" TEXT NOT NULL,
    "partnerId" INTEGER NOT NULL,
    "partnerName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "signatureUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignOff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingStatus" (
    "id" SERIAL NOT NULL,
    "donorShippingNumber" TEXT NOT NULL,
    "hfhShippingNumber" TEXT NOT NULL,
    "value" "ShipmentStatus" NOT NULL,

    CONSTRAINT "ShippingStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unitSize" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priority" "RequestPriority" NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "comments" TEXT NOT NULL,
    "partnerId" INTEGER NOT NULL,
    "generalItemId" INTEGER,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "action" TEXT,
    "actionText" TEXT,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateViewed" TIMESTAMP(3),
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DonorOfferToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DonorOfferToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserInvite_token_key" ON "UserInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "UserInvite_userId_key" ON "UserInvite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralItem_donorOfferId_title_expirationDate_unitType_key" ON "GeneralItem"("donorOfferId", "title", "expirationDate", "unitType");

-- CreateIndex
CREATE UNIQUE INDEX "ItemEmbeddings_generalItemId_key" ON "ItemEmbeddings"("generalItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemEmbeddings_wishlistId_key" ON "ItemEmbeddings"("wishlistId");

-- CreateIndex
CREATE INDEX "ItemEmbeddings_donorOfferId_idx" ON "ItemEmbeddings"("donorOfferId");

-- CreateIndex
CREATE INDEX "ItemEmbeddings_generalItemId_idx" ON "ItemEmbeddings"("generalItemId");

-- CreateIndex
CREATE INDEX "ItemEmbeddings_wishlistId_idx" ON "ItemEmbeddings"("wishlistId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralItemRequest_generalItemId_partnerId_key" ON "GeneralItemRequest"("generalItemId", "partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_lineItemId_key" ON "Allocation"("lineItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingStatus_donorShippingNumber_hfhShippingNumber_key" ON "ShippingStatus"("donorShippingNumber", "hfhShippingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "Notification_userId_dateViewed_idx" ON "Notification"("userId", "dateViewed");

-- CreateIndex
CREATE INDEX "_DonorOfferToUser_B_index" ON "_DonorOfferToUser"("B");

-- AddForeignKey
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralItem" ADD CONSTRAINT "GeneralItem_donorOfferId_fkey" FOREIGN KEY ("donorOfferId") REFERENCES "DonorOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_generalItemId_fkey" FOREIGN KEY ("generalItemId") REFERENCES "GeneralItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEmbeddings" ADD CONSTRAINT "ItemEmbeddings_generalItemId_fkey" FOREIGN KEY ("generalItemId") REFERENCES "GeneralItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEmbeddings" ADD CONSTRAINT "ItemEmbeddings_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "Wishlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemEmbeddings" ADD CONSTRAINT "ItemEmbeddings_donorOfferId_fkey" FOREIGN KEY ("donorOfferId") REFERENCES "DonorOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralItemRequest" ADD CONSTRAINT "GeneralItemRequest_generalItemId_fkey" FOREIGN KEY ("generalItemId") REFERENCES "GeneralItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralItemRequest" ADD CONSTRAINT "GeneralItemRequest_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "LineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "Distribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_signOffId_fkey" FOREIGN KEY ("signOffId") REFERENCES "SignOff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_generalItemId_fkey" FOREIGN KEY ("generalItemId") REFERENCES "GeneralItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DonorOfferToUser" ADD CONSTRAINT "_DonorOfferToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "DonorOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DonorOfferToUser" ADD CONSTRAINT "_DonorOfferToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

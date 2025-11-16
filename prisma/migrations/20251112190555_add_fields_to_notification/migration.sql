-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "isDelivered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "template" TEXT;

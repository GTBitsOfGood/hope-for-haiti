-- DropIndex
DROP INDEX "Notification_dateViewed_idx";

-- DropIndex
DROP INDEX "Notification_userId_idx";

-- CreateIndex
CREATE INDEX "Notification_userId_dateViewed_idx" ON "Notification"("userId", "dateViewed");

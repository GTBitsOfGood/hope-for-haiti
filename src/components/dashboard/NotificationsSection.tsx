"use client";

import { useState } from "react";
import NotificationCard from "./NotificationCard";
import NotificationsPanel from "./NotificationsPanel";
import type { Notification } from "./types";

interface NotificationsSectionProps {
  notifications: Notification[];
}

export default function NotificationsSection({
  notifications,
}: NotificationsSectionProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const displayedNotifications = notifications.slice(0, 2);
  const hasMore = notifications.length > 2;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
        {notifications.length > 0 && (
          <button
            onClick={() => setIsPanelOpen(true)}
            className="px-4 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            View All
          </button>
        )}
      </div>

      <hr className="mb-4 border-gray-200" />

      {displayedNotifications.length > 0 ? (
        <div className="space-y-3">
          {displayedNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              message={notification.message}
              actionText={notification.actionText}
            />
          ))}
          {hasMore && (
            <p className="text-sm text-gray-500 text-center">
              +{notifications.length - 2} more notifications
            </p>
          )}
        </div>
      ) : (
        <p className="text-gray-500">No new notifications</p>
      )}

      <NotificationsPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        notifications={notifications}
      />
    </div>
  );
}

"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import NotificationCard from "./NotificationCard";
import { Notification } from "@prisma/client";

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

export default function NotificationsPanel({
  isOpen,
  onClose,
  notifications,
}: NotificationsPanelProps) {
  if (!isOpen) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayNotifications = notifications.filter((notif) => {
    const notifDate = new Date(notif.dateCreated);
    notifDate.setHours(0, 0, 0, 0);
    return notifDate.getTime() === today.getTime();
  });

  const previousNotifications = notifications.filter((notif) => {
    const notifDate = new Date(notif.dateCreated);
    notifDate.setHours(0, 0, 0, 0);
    return notifDate.getTime() < today.getTime();
  });

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 h-full w-full sm:w-[750px] bg-white shadow-xl z-50 transform transition-transform">
        <div className="h-full overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
            <button
              onClick={onClose}
              className="mb-4 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-600 mt-1">
              {notifications.length} Message
              {notifications.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {todayNotifications.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Today
                </h2>
                <div className="space-y-3">
                  {todayNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      id={notification.id}
                      message={notification.title}
                      actionText={notification.actionText ?? undefined}
                      actionUrl={notification.action ?? undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {previousNotifications.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Previous
                </h2>
                <div className="space-y-3">
                  {previousNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      id={notification.id}
                      message={notification.title}
                      actionText={notification.actionText ?? undefined}
                      actionUrl={notification.action ?? undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {notifications.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No notifications
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

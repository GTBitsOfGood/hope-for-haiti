"use client";

import { useState, useEffect } from "react";
import NotificationCard from "./NotificationCard";
import { Notification } from "@prisma/client";

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

type TabType = "all" | "chats" | "alerts";

export default function NotificationsPanel({
  isOpen,
  onClose,
  notifications,
}: NotificationsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === "all") return true;
    if (activeTab === "chats") return notif.type === "CHAT";
    if (activeTab === "alerts") return notif.type === "ALERT";
    return true;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayNotifications = filteredNotifications.filter((notif) => {
    const notifDate = new Date(notif.dateCreated);
    notifDate.setHours(0, 0, 0, 0);
    return notifDate.getTime() === today.getTime();
  });

  const previousNotifications = filteredNotifications.filter((notif) => {
    const notifDate = new Date(notif.dateCreated);
    notifDate.setHours(0, 0, 0, 0);
    return notifDate.getTime() < today.getTime();
  });

  return (
    <>
      <div
        className={`fixed inset-0 z-40 cursor-default ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute top-full right-0 mt-3 w-screen max-w-[480px] bg-white shadow-2xl z-50 p-6 rounded-2xl border border-gray-100 origin-top-right transition-all duration-200 ease-out ${
          isVisible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-2"
        }`}
      >
        <div className="sticky space-y-4 top-0 bg-white z-10 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">
            Notifications
          </h1>

          <div className="flex gap-8 border-b border-gray-100 relative">
            {(["all", "chats", "alerts"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 text-sm font-bold capitalize transition-colors outline-none ${
                  activeTab === tab
                    ? "text-blue-primary"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-blue-primary rounded-full z-10" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="py-4 space-y-5 max-h-[600px] overflow-y-auto">
          {filteredNotifications.length > 0 ? (
            <>
              {todayNotifications.length > 0 && (
                <section>
                  <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
                    Today
                  </h2>
                  <div className="grid gap-2">
                    {todayNotifications.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        id={notification.id}
                        message={notification.title}
                        actionText={notification.actionText ?? undefined}
                        actionUrl={notification.action ?? undefined}
                        dateCreated={notification.dateCreated}
                        type={notification.type}
                      />
                    ))}
                  </div>
                </section>
              )}

              {previousNotifications.length > 0 && (
                <section>
                  <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
                    Previous
                  </h2>
                  <div className="grid gap-2">
                    {previousNotifications.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        id={notification.id}
                        message={notification.title}
                        actionText={notification.actionText ?? undefined}
                        actionUrl={notification.action ?? undefined}
                        dateCreated={notification.dateCreated}
                        type={notification.type}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center pt-10 pb-6 text-gray-400">
                <p className="text-sm font-medium">
                  {activeTab === "all"
                    ? "No notifications yet"
                    : "No {activeTab} notifications yet"}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
